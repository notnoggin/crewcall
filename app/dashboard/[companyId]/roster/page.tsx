import Link from "next/link";
import { notFound } from "next/navigation";
import { Roster } from "@/components/roster";
import { BenchImport } from "@/components/bench-import";
import { DashboardNav } from "@/components/dashboard-nav";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function RosterPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase
		.from("workspaces")
		.select("id")
		.eq("whop_company_id", companyId)
		.maybeSingle();
	if (!workspace) notFound();

	const [{ data: entries }, { data: campaigns }] = await Promise.all([
		supabase
			.from("roster_entries")
			.select(
				"id, person_whop_id, role_tag, status, last_active_at, coverage_window, role_id, source, contact_name, contact_email, contact_handle, import_notes, weekly_capacity, timezone, rate_requested, platforms, applications(applicant_email, weekly_capacity, timezone, rate_requested, answers), roles(title)",
			)
			.eq("workspace_id", workspace.id)
			.order("created_at", { ascending: false }),
		supabase
			.from("roles")
			.select("id, title")
			.eq("workspace_id", workspace.id)
			.order("created_at", { ascending: false }),
	]);

	const mapped = (entries || []).map((entry) => {
		const application = Array.isArray(entry.applications) ? entry.applications[0] : entry.applications;
		const role = Array.isArray(entry.roles) ? entry.roles[0] : entry.roles;
		const answers = application?.answers as Record<string, unknown> | null;
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
			entry.contact_name ||
			application?.applicant_email ||
			entry.contact_email ||
			"Unknown";
		const applicant_email =
			entry.contact_email || application?.applicant_email || entry.contact_name || "Unknown";

		return {
			...entry,
			display_name: displayName,
			applicant_email,
			weekly_capacity: entry.weekly_capacity ?? application?.weekly_capacity ?? null,
			timezone: entry.timezone ?? application?.timezone ?? null,
			rate_requested: entry.rate_requested ?? application?.rate_requested ?? null,
			platforms,
			campaign_title: role?.title || null,
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
				<div className="my-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="page-kicker">Ready for the next campaign</p>
						<h1 className="page-title">Bench</h1>
						<p className="page-subtitle">
							People you can pull into the next campaign, ready when you need them.
						</p>
					</div>
					{!isEmpty && <BenchImport companyId={companyId} />}
				</div>

				{isEmpty ? (
					<div className="grid gap-6">
						<BenchImport companyId={companyId} empty />
						<p className="text-center text-3 text-gray-9">
							Or hire from a role review queue — approved people land here automatically.
						</p>
					</div>
				) : (
					<Roster entries={mapped as never} campaigns={campaigns || []} />
				)}
			</div>
		</main>
	);
}
