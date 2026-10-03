import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
	const body = (await request.json()) as { roleId?: string; email?: string };
	const email = body.email?.trim().toLowerCase();
	if (!body.roleId || !email) return NextResponse.json({ error: "Role and email are required." }, { status: 400 });
	const { data: application, error } = await getSupabaseAdmin()
		.from("applications")
		.select("id, status_token")
		.eq("role_id", body.roleId)
		.eq("status_email", email)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	if (!application) return NextResponse.json({ error: "No application was found for that email." }, { status: 404 });
	const origin = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : new URL(request.url).origin);
	return NextResponse.json({ statusUrl: `${origin.replace(/\/$/, "")}/a/${application.id}?k=${application.status_token}` });
}
