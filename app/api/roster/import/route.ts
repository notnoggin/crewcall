import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { hasCrewcallAccess } from "@/lib/crewcall-access";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getWhopSdk } from "@/lib/whop-sdk";
import { BENCH_IMPORT_MAX_ROWS, parseBenchImportCsv } from "@/lib/bench-import";

export async function POST(request: Request) {
	const { hasAccess } = await hasCrewcallAccess();
	if (!hasAccess) {
		return NextResponse.json({ error: "Crewcall Pro membership is required." }, { status: 403 });
	}

	await getWhopSdk().verifyUserToken(await headers());

	const body = (await request.json()) as { companyId?: string; csv?: string };
	if (!body.companyId?.trim()) {
		return NextResponse.json({ error: "companyId is required." }, { status: 400 });
	}
	if (typeof body.csv !== "string" || !body.csv.trim()) {
		return NextResponse.json({ error: "CSV content is required." }, { status: 400 });
	}

	const { rows, errors: parseErrors } = parseBenchImportCsv(body.csv);
	if (parseErrors.length && !rows.length) {
		return NextResponse.json(
			{ error: "Could not parse CSV.", parseErrors, imported: 0, skipped: 0 },
			{ status: 400 },
		);
	}

	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase
		.from("workspaces")
		.select("id")
		.eq("whop_company_id", body.companyId)
		.maybeSingle();

	if (!workspace) {
		return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
	}

	// Existing emails on this bench (from applications + prior imports)
	const { data: existing } = await supabase
		.from("roster_entries")
		.select("id, contact_email, applications(applicant_email)")
		.eq("workspace_id", workspace.id);

	const existingEmails = new Set<string>();
	for (const entry of existing || []) {
		if (entry.contact_email) existingEmails.add(entry.contact_email.toLowerCase());
		const app = Array.isArray(entry.applications) ? entry.applications[0] : entry.applications;
		const appEmail = (app as { applicant_email?: string } | null)?.applicant_email;
		if (appEmail) existingEmails.add(appEmail.toLowerCase());
	}

	let imported = 0;
	let skipped = 0;
	const rowErrors = [...parseErrors];

	for (const row of rows) {
		if (existingEmails.has(row.email)) {
			skipped += 1;
			rowErrors.push({ line: row.line, message: `Already on bench: ${row.email}` });
			continue;
		}

		const { error } = await supabase.from("roster_entries").insert({
			workspace_id: workspace.id,
			application_id: null,
			person_whop_id: null,
			role_tag: row.role_tag,
			status: row.status,
			source: "import",
			contact_name: row.name,
			contact_email: row.email,
			contact_handle: row.handle,
			import_notes: row.notes,
			weekly_capacity: row.weekly_capacity,
			timezone: row.timezone,
			rate_requested: row.rate,
			platforms: row.platforms,
		});

		if (error) {
			rowErrors.push({ line: row.line, message: error.message });
			continue;
		}

		existingEmails.add(row.email);
		imported += 1;
	}

	return NextResponse.json({
		ok: true,
		imported,
		skipped,
		parseErrors: rowErrors,
		maxRows: BENCH_IMPORT_MAX_ROWS,
	});
}
