import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isSupportedClipUrl } from "@/lib/application-fields";

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
		.select("id, status, intake_mode, seat_cap, active_fields")
		.eq("id", body.roleId)
		.maybeSingle();
	if (roleError && /active_fields/i.test(roleError.message)) {
		const retry = await supabase.from("roles").select("id, status, intake_mode, seat_cap").eq("id", body.roleId).maybeSingle();
		role = retry.data ? { ...retry.data, active_fields: null } : null;
		roleError = retry.error;
	}
	if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 });

	if (!role || role.status !== "open") {
		return NextResponse.json({ error: "Applications closed." }, { status: 404 });
	}

	if (typeof body.answers?.clipSamples !== "undefined") {
		const samples = body.answers.clipSamples;
		if (!Array.isArray(samples) || samples.length < 2 || samples.length > 4 || samples.some((sample) => typeof sample?.url !== "string" || !isSupportedClipUrl(sample.url))) {
			return NextResponse.json({ error: "Clip samples must be 2 to 4 TikTok, Instagram Reels, or YouTube Shorts links." }, { status: 400 });
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
	const { data: application, error } = await supabase.from("applications").insert({
		role_id: body.roleId,
		applicant_email: body.applicantEmail.trim(),
		applicant_whop_id: body.applicantWhopId?.trim() || null,
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

	const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || new URL(request.url).origin;
	return NextResponse.json({ ok: true, statusUrl: application ? `${origin}/apply/${body.roleId}/status/${application.id}?token=${application.status_token}` : null });
}
