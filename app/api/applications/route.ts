import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
	const body = (await request.json()) as {
		roleId?: string;
		applicantEmail?: string;
		applicantWhopId?: string;
		answers?: Record<string, string>;
	};

	if (!body.roleId || !body.applicantEmail?.trim() || !body.answers) {
		return NextResponse.json({ error: "Email and application answers are required." }, { status: 400 });
	}

	const supabase = getSupabaseAdmin();
	const { data: role } = await supabase
		.from("roles")
		.select("id, status, intake_mode, seat_cap")
		.eq("id", body.roleId)
		.maybeSingle();

	if (!role || role.status !== "open") {
		return NextResponse.json({ error: "Applications closed." }, { status: 404 });
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

	const { error } = await supabase.from("applications").insert({
		role_id: body.roleId,
		applicant_email: body.applicantEmail.trim(),
		applicant_whop_id: body.applicantWhopId?.trim() || null,
		answers: body.answers,
	});

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
