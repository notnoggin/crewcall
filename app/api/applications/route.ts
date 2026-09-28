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
		.select("id, status")
		.eq("id", body.roleId)
		.maybeSingle();

	if (!role || role.status !== "open") {
		return NextResponse.json({ error: "This role is not accepting applications." }, { status: 404 });
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
