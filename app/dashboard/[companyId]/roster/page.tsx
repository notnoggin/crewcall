import Link from "next/link";
import { notFound } from "next/navigation";
import { Roster } from "@/components/roster";
import { BenchImport } from "@/components/bench-import";
import { DashboardNav } from "@/components/dashboard-nav";
import { getSupabaseAdmin } from "@/lib/supabase";

/** Base columns that always exist (pre-import migration). */
const BASE_SELECT =
	"id, person_whop_id, role_tag, status, last_active_at, coverage_window, role_id, applications(applicant_email, weekly_capacity, timezone, rate_requested, answers), roles(title)";

/** Includes CSV-import columns — only works after migration is applied. */
const FULL_SELECT =
	"id, person_whop_id, role_tag, status, last_active_at, coverage_window, role_id, source, contact_name, contact_email, contact_handle, import_notes, weekly_capacity, timezone, rate_requested, platforms, applications(applicant_email, weekly_capacity, timezone, rate_requested, answers), roles(title)";

type EntryRow = Record<string, unknown> & {
	id: string;
	person_whop_id: string | null;
	role_tag: string;
	status: string;
	last_active_at: string | null;
	coverage_window: string | null;
	role_id: string | null;
	source?: string | null;
	contact_name?: string | null;
	contact_email?: string | null;
	contact_handle?: string | null;
	import_notes?: string | null;
	weekly_capacity?: number | null;
	timezone?: string | null;
	rate_requested?: number | null;
	platforms?: string[] | null;
	applications?: unknown;
	roles?: unknown;
};

export default async function RosterPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase
		.from("workspaces")
		.select("id")
		.eq("whop_company_id", companyId)
		.maybeSingle();
	if (!workspace) notFound();

	// Prefer full select (import fields). If migration not applied, fall back so real bench rows still show.
	let entries: EntryRow[] | null = null;
	const full = await supabase
		.from("roster_entries")
		.select(FULL_SELECT)
		.eq("workspace_id", workspace.id)
		.order("created_at", { ascending: false });

	if (full.error) {
		console.warn("[bench] full select failed, using base columns:", full.error.message);
		const base = await supabase
			.from("roster_entries")
			.select(BASE_SELECT)
			.eq("workspace_id", workspace.id)
			.order("created_at", { ascending: false });
		if (base.error) {
			console.error("[bench] base select failed:", base.error.message);
		}
		entries = (base.data as EntryRow[] | null) ?? [];
	} else {
		entries = (full.data as EntryRow[] | null) ?? [];
	}

	const { data: campaigns } = await supabase
		.from("roles")
		.select("id, title")
		.eq("workspace_id", workspace.id)
		.order("created_at", { ascending: false });

	const mapped = (entries || []).map((entry) => {
		const application = Array.isArray(entry.applications) ? entry.applications[0] : entry.applications;
		const role = Array.isArray(entry.roles) ? entry.roles[0] : entry.roles;
		const app = application as
			| {
					applicant_email?: string;
					weekly_capacity?: number | null;
					timezone?: string | null;
					rate_requested?: number | null;
					answers?: Record<string, unknown> | null;
			  }
			| null;
		const roleObj = role as { title?: string } | null;

		const answers = app?.answers ?? null;
		const rawPlatforms = answers?.platforms;
		const fromAnswers = Array.isArray(rawPlatforms)
			? rawPlatforms.map(String)
			: typeof rawPlatforms === "string"
				? rawPlatforms
						.split(",")
						.map((item) => item.trim())
						.filter(Boolean)
				: [];
		const platforms =
			Array.isArray(entry.platforms) && entry.platforms.length
				? entry.platforms.map(String)
				: fromAnswers;

		const displayName =
			entry.contact_name || app?.applicant_email || entry.contact_email || "Unknown";
		const applicant_email =
			entry.contact_email || app?.applicant_email || entry.contact_name || "Unknown";

		return {
			id: entry.id,
			person_whop_id: entry.person_whop_id,
			role_tag: entry.role_tag,
			status: entry.status,
			last_active_at: entry.last_active_at,
			coverage_window: entry.coverage_window,
			role_id: entry.role_id,
			contact_handle: entry.contact_handle ?? null,
			display_name: displayName,
			applicant_email,
			weekly_capacity: entry.weekly_capacity ?? app?.weekly_capacity ?? null,
			timezone: entry.timezone ?? app?.timezone ?? null,
			rate_requested: entry.rate_requested ?? app?.rate_requested ?? null,
			platforms,
			campaign_title: roleObj?.title || null,
			is_import: entry.source === "import",
		};
	});

	const isEmpty = !mapped.length;

	return (
		<main className="dashboard-shell">
			<div className="max-w-7xl">
				<DashboardNav companyId={companyId} />
				<Link href={`/dashboard/${companyId}`} className="button-link">
					← Back to dashboard
				</Link>

				<div className="my-8">
					<p className="page-kicker">Ready for the next campaign</p>
					<h1 className="page-title">Bench</h1>
					<p className="page-subtitle">
						People you can pull into the next campaign, ready when you need them.
					</p>
				</div>

				{isEmpty ? (
					<div className="bench-empty-stack">
						<BenchImport companyId={companyId} empty />
						<p className="bench-empty-hint">
							Or hire from a role review queue — approved people land here automatically.
						</p>
					</div>
				) : (
					<div className="bench-filled-stack">
						<BenchImport companyId={companyId} compact />
						<Roster entries={mapped as never} campaigns={campaigns || []} />
					</div>
				)}
			</div>
		</main>
	);
}
