import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getWhopSdk } from "@/lib/whop-sdk";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ rosterId: string }> },
) {
	try {
		await getWhopSdk().verifyUserToken(await headers());
		const { rosterId } = await params;
		const supabase = getSupabaseAdmin();
		const { data: entry, error: entryError } = await supabase
			.from("roster_entries")
			.select("id, application_id")
			.eq("id", rosterId)
			.maybeSingle();
		if (entryError || !entry) throw new Error(`Roster history lookup failed: ${entryError?.message || "not found"}`);

		const [{ data: events, error: eventsError }, { data: tests, error: testsError }] = await Promise.all([
			supabase.from("application_events").select("id, actor_id, action, note, created_at").eq("application_id", entry.application_id).order("created_at", { ascending: false }),
			supabase.from("tests").select("id, brief, paid, pay_amount, sent_at, due_at, submitted_at, outcome").eq("application_id", entry.application_id).order("created_at", { ascending: false }),
		]);
		if (eventsError) throw new Error(`Roster events lookup failed: ${eventsError.message}`);
		if (testsError) throw new Error(`Roster tests lookup failed: ${testsError.message}`);
		return NextResponse.json({ events: events || [], tests: tests || [] });
	} catch (error) {
		console.error("Crewcall roster history failed:", error);
		return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load roster history." }, { status: 500 });
	}
}
