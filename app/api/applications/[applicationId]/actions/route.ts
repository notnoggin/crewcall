import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getWhopSdk } from "@/lib/whop-sdk";
import { notifyApplicant } from "@/lib/notifications";
import { rejectReasons, type ReviewStatus } from "@/lib/hiring";
import { grantRosterAccess } from "@/lib/whop-access";

type ActionBody = {
	action?: "request_sample" | "needs_info" | "send_test" | "test_result" | "hire" | "reject" | "save_review";
	note?: string;
	score?: number;
	brief?: string;
	paid?: boolean;
	payAmount?: number | null;
	dueAt?: string | null;
	outcome?: "passed" | "failed" | "ghosted";
	reason?: string;
};

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ applicationId: string }> },
) {
	const { applicationId } = await params;
	const whopsdk = getWhopSdk();
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const body = (await request.json()) as ActionBody;
	const supabase = getSupabaseAdmin();
	const { data: application, error: applicationError } = await supabase
		.from("applications")
		.select("id, role_id, applicant_whop_id, applicant_email, status_token, notes, score, status, roles(title, workspaces(whop_company_id))")
		.eq("id", applicationId)
		.maybeSingle();

	if (applicationError || !application) {
		return NextResponse.json({ error: "Application not found." }, { status: 404 });
	}

	const role = Array.isArray(application.roles) ? application.roles[0] : application.roles;
	const workspace = role && (Array.isArray(role.workspaces) ? role.workspaces[0] : role.workspaces);
	const companyId = workspace?.whop_company_id;
	const actorId = userId;
	let nextStatus: ReviewStatus | "rejected" | "dismissed" | null = null;
	let eventAction = body.action || "review";
	let eventNote = body.note?.trim() || null;
	let notification = "";

	if (body.action === "request_sample") {
		nextStatus = "sample_requested";
		notification = "Please reply with your relevant work samples so we can continue reviewing your application.";
	} else if (body.action === "needs_info") {
		if (!eventNote) return NextResponse.json({ error: "A question is required." }, { status: 400 });
		nextStatus = "needs_info";
		notification = eventNote;
	} else if (body.action === "send_test") {
		if (!body.brief?.trim()) return NextResponse.json({ error: "A test brief is required." }, { status: 400 });
		const { error } = await supabase.from("tests").insert({
			application_id: applicationId,
			brief: body.brief.trim(),
			paid: Boolean(body.paid),
			pay_amount: body.payAmount ?? null,
			due_at: body.dueAt || null,
		});
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		nextStatus = "test_sent";
		notification = `A test brief has been sent. Please submit your work by ${body.dueAt ? new Date(body.dueAt).toLocaleString() : "the agreed deadline"}.`;
	} else if (body.action === "test_result") {
		if (!body.outcome) return NextResponse.json({ error: "Choose a test result." }, { status: 400 });
		const { data: test } = await supabase.from("tests").select("id").eq("application_id", applicationId).order("created_at", { ascending: false }).limit(1).maybeSingle();
		if (!test) return NextResponse.json({ error: "No test exists for this application." }, { status: 400 });
		const { error } = await supabase.from("tests").update({ outcome: body.outcome }).eq("id", test.id);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		nextStatus = body.outcome === "passed" ? "test_submitted" : body.outcome === "ghosted" ? "dismissed" : "rejected";
		notification = `Your test result has been marked: ${body.outcome}.`;
	} else if (body.action === "hire") {
		const { data: roleData } = await supabase.from("roles").select("workspace_id, type, intake_mode, seat_cap").eq("id", application.role_id).single();
		if (!roleData) return NextResponse.json({ error: "Role not found." }, { status: 404 });
		const roleTag = ["clipper", "moderator", "editor", "va", "ops"].includes(roleData.type.toLowerCase()) ? roleData.type.toLowerCase() : "ops";
		const { data: rosterEntry, error } = await supabase.from("roster_entries").insert({
			workspace_id: roleData.workspace_id,
			application_id: applicationId,
			person_whop_id: application.applicant_whop_id,
			role_tag: roleTag,
			status: "bench",
		}).select("id").single();
		if (error || !rosterEntry) return NextResponse.json({ error: error?.message || "Could not create roster entry." }, { status: 500 });
		const workspaceForAccess = companyId;
		if (workspaceForAccess) {
			await grantRosterAccess({
				companyId: workspaceForAccess,
				personWhopId: application.applicant_whop_id,
				roleTag,
			});
		}
		nextStatus = "bench";
		if (roleData.intake_mode === "limited_seats" && roleData.seat_cap) {
			const { count, error: countError } = await supabase
				.from("applications")
				.select("id", { count: "exact", head: true })
				.eq("role_id", application.role_id)
				.in("status", ["bench", "active", "paused"]);
			if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
			if ((count || 0) >= roleData.seat_cap) {
				const { error: closeError } = await supabase.from("roles").update({ status: "closed" }).eq("id", application.role_id);
				if (closeError) return NextResponse.json({ error: closeError.message }, { status: 500 });
			}
		}
		notification = "You have been moved to the Crewcall bench. The team will contact you about next steps.";
	} else if (body.action === "reject") {
		if (!body.reason || !rejectReasons.includes(body.reason as (typeof rejectReasons)[number])) {
			return NextResponse.json({ error: "Choose a valid rejection reason." }, { status: 400 });
		}
		nextStatus = "rejected";
		eventNote = [body.reason, body.note?.trim()].filter(Boolean).join(": ");
		notification = "Thanks for applying. We will not be moving forward with this application.";
	} else if (body.action === "save_review") {
		if (body.score !== undefined && (!Number.isInteger(body.score) || body.score < 1 || body.score > 5)) {
			return NextResponse.json({ error: "Score must be between 1 and 5." }, { status: 400 });
		}
		const { error } = await supabase.from("applications").update({
			notes: body.note?.trim() ?? application.notes,
			score: body.score ?? application.score,
			reviewer_id: actorId,
		}).eq("id", applicationId);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		eventAction = "review_saved";
		eventNote = "Internal review notes or score updated.";
	}

	if (nextStatus) {
		const { error } = await supabase.from("applications").update({
			status: nextStatus,
			reviewer_id: actorId,
			...(body.action === "reject" ? { reject_reason: body.reason } : {}),
			...(body.note ? { notes: body.note.trim() } : {}),
		}).eq("id", applicationId);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const { error: eventError } = await supabase.from("application_events").insert({
		application_id: applicationId,
		actor_id: actorId,
		action: eventAction,
		note: eventNote,
	});
	if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

	if (nextStatus) {
		try {
			const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || "https://crewcall-ten.vercel.app";
			const roleTitle = Array.isArray(application.roles) ? application.roles[0]?.title : role?.title;
			const statusLabels: Record<string, string> = {
				needs_info: "More information needed",
				sample_requested: "More samples requested",
				test_sent: "Test sent",
				test_submitted: "Test submitted",
				bench: "Added to the hiring bench",
				rejected: "Not moving forward",
				dismissed: "Application closed",
			};
			const statusUrl = `${origin}/apply/${application.role_id}/status/${application.id}?token=${application.status_token}`;
			const statusLabel = body.action === "test_result" ? `Test ${body.outcome}` : statusLabels[nextStatus] || nextStatus;
			const delivery = await notifyApplicant({ companyId: companyId || "", applicantWhopId: application.applicant_whop_id, applicantEmail: application.applicant_email, roleTitle: roleTitle || "Crewcall role", statusLabel, statusUrl, note: body.note?.trim() || null, message: notification || `Your application status has been updated to ${statusLabel}.` });
			console.info("[APPLICANT NOTIFICATION SENT]", { applicationId, status: statusLabel, channel: delivery.channel, delivered: delivery.delivered });
		} catch (error) {
			console.error("[APPLICANT NOTIFICATION]", error);
		}
	}

	return NextResponse.json({ ok: true, status: nextStatus || application.status });
}
