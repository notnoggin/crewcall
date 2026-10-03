import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { clipPlatformMessage, isClipUrlForPlatforms } from "@/lib/application-fields";
import { getWhopSdk } from "@/lib/whop-sdk";
import { notifyApplicant, notifyWorkspaceAdminsDm } from "@/lib/notifications";

export async function POST(request: Request) {
	const body = (await request.json()) as {
		roleId?: string;
		applicantEmail?: string;
		applicantWhopId?: string;
		answers?: Record<string, unknown>;
	};

	if (!body.roleId || !body.applicantEmail?.trim() || !body.answers) {
		return NextResponse.json({ error: "Email and application answers are required." }, { status: 400 });
	}

	const supabase = getSupabaseAdmin();
	let { data: role, error: roleError } = await supabase
		.from("roles")
		.select("id, title, status, intake_mode, seat_cap, active_fields, platforms, workspaces(whop_company_id)")
		.eq("id", body.roleId)
		.maybeSingle();
	if (roleError && /active_fields/i.test(roleError.message)) {
		const retry = await supabase.from("roles").select("id, title, status, intake_mode, seat_cap, platforms, workspaces(whop_company_id)").eq("id", body.roleId).maybeSingle();
		role = retry.data ? { ...retry.data, active_fields: null } : null;
		roleError = retry.error;
	}
	if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 });

	if (!role || role.status !== "open") {
		return NextResponse.json({ error: "Applications closed." }, { status: 404 });
	}

	if (typeof body.answers?.clipSamples !== "undefined") {
		const samples = body.answers.clipSamples;
		const platforms = Array.isArray(role.platforms) ? role.platforms : [];
		if (!Array.isArray(samples) || samples.length < 2 || samples.length > 4 || samples.some((sample) => typeof sample?.url !== "string" || !isClipUrlForPlatforms(sample.url, platforms))) {
			return NextResponse.json({ error: platforms.length ? clipPlatformMessage(platforms) : "Clip samples must be 2 to 4 valid platform links." }, { status: 400 });
		}
	}

	if (role.intake_mode === "limited_seats" && role.seat_cap) {
		const { count, error: countError } = await supabase
			.from("applications")
			.select("id", { count: "exact", head: true })
			.eq("role_id", body.roleId)
			.in("status", ["bench", "active", "paused"]);
		if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
		if ((count || 0) >= role.seat_cap) {
			await supabase.from("roles").update({ status: "closed" }).eq("id", body.roleId);
			return NextResponse.json({ error: "Applications closed." }, { status: 409 });
		}
	}

	const answers = body.answers;
	const clipSamples = Array.isArray(answers.clipSamples) ? answers.clipSamples as { url?: string }[] : [];
	const statusEmail = body.applicantEmail.trim().toLowerCase();
	const { data: existingApplication } = await supabase.from("applications").select("id, status_token").eq("role_id", body.roleId).eq("status_email", statusEmail).order("created_at", { ascending: false }).limit(1).maybeSingle();
	if (existingApplication) {
		const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || new URL(request.url).origin;
		return NextResponse.json({ error: "You already applied for this role.", alreadyApplied: true, statusUrl: `${origin}/a/${existingApplication.id}?k=${existingApplication.status_token}` }, { status: 409 });
	}
	const workspace = Array.isArray(role.workspaces) ? role.workspaces[0] : role.workspaces;
	let applicantWhopId = body.applicantWhopId?.trim() || null;
	if (!applicantWhopId && workspace?.whop_company_id) {
		try {
			const members = await getWhopSdk().members.list({ company_id: workspace.whop_company_id, query: statusEmail, first: 10 });
			const member = members.data.find((item) => item.user?.email?.toLowerCase() === statusEmail);
			applicantWhopId = member?.user?.id || null;
			console.info("[APPLICANT WHOP ID LOOKUP]", { applicantEmail: statusEmail, whopIdFound: Boolean(applicantWhopId), reason: applicantWhopId ? "member_email_match" : "no_whop_account_found" });
		} catch (lookupError) {
			console.error("[APPLICANT WHOP ID LOOKUP FAILED]", { applicantEmail: statusEmail, error: lookupError instanceof Error ? lookupError.message : "Unknown error" });
		}
	}
	const { data: application, error } = await supabase.from("applications").insert({
		role_id: body.roleId,
		applicant_email: body.applicantEmail.trim(),
		applicant_whop_id: applicantWhopId,
		status_email: statusEmail,
		answers,
		sample_links: clipSamples.map((sample) => sample.url).filter((url): url is string => Boolean(url)),
		weekly_capacity: typeof answers.weeklyCapacity === "string" && answers.weeklyCapacity ? Number(answers.weeklyCapacity) : null,
		timezone: typeof answers.timezone === "string" ? answers.timezone : null,
		rate_requested: typeof answers.rateWanted === "string" && answers.rateWanted ? Number(answers.rateWanted) : null,
		rate_currency: typeof answers.rateCurrency === "string" ? answers.rateCurrency : "USD",
	}).select("id, status_token").single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	const { error: eventError } = await supabase.from("application_events").insert({
		application_id: application.id,
		action: "application_submitted",
		note: "Application received.",
	});
	if (eventError) console.error("[APPLICATION SUBMIT EVENT FAILED]", { applicationId: application.id, error: eventError.message });

	const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || new URL(request.url).origin;
	const statusUrl = application ? `${origin}/a/${application.id}?k=${application.status_token}` : null;
	if (application && statusUrl) {
		const roleWorkspace = Array.isArray(role.workspaces) ? role.workspaces[0] : role.workspaces;
		try {
			const delivery = await notifyApplicant({
				companyId: roleWorkspace?.whop_company_id || "",
				applicantWhopId,
				applicantEmail: statusEmail,
				roleTitle: role.title,
				statusLabel: "Application received",
				statusUrl,
				message: "Your application was received. We will update this status page as your application moves through review.",
			});
			console.info("[APPLICATION SUBMIT NOTIFICATION]", { applicationId: application.id, whopIdFound: Boolean(applicantWhopId), dmAttempted: Boolean(applicantWhopId), result: delivery });
		} catch (notificationError) {
			console.error("[APPLICATION SUBMIT NOTIFICATION FAILED]", { applicationId: application.id, error: notificationError instanceof Error ? notificationError.message : "Unknown error" });
		}
		if (roleWorkspace?.whop_company_id) {
			try {
				await notifyWorkspaceAdminsDm({ companyId: roleWorkspace.whop_company_id, roleTitle: role.title, applicantEmail: statusEmail, statusUrl });
			} catch (agencyNotificationError) {
				console.error("[AGENCY WHOP DM ERROR]", { applicationId: application.id, error: agencyNotificationError instanceof Error ? agencyNotificationError.message : "Unknown error" });
			}
		}
	}
	return NextResponse.json({ ok: true, statusUrl });
}
