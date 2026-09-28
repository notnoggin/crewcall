import Link from "next/link";
import { notFound } from "next/navigation";
import { Roster } from "@/components/roster";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function RosterPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase.from("workspaces").select("id").eq("whop_company_id", companyId).maybeSingle();
	if (!workspace) notFound();
	const [{ data: entries }, { data: campaigns }] = await Promise.all([
		supabase.from("roster_entries").select("id, person_whop_id, role_tag, status, last_active_at, coverage_window, role_id, applications!inner(applicant_email, weekly_capacity, timezone, rate_requested, answers), roles(title)").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
		supabase.from("roles").select("id, title").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
	]);
	const mapped = (entries || []).map((entry) => {
		const application = Array.isArray(entry.applications) ? entry.applications[0] : entry.applications;
		const role = Array.isArray(entry.roles) ? entry.roles[0] : entry.roles;
		const answers = application?.answers as Record<string, unknown> | null;
		const rawPlatforms = answers?.platforms;
		const platforms = Array.isArray(rawPlatforms) ? rawPlatforms.map(String) : typeof rawPlatforms === "string" ? rawPlatforms.split(",").map((item) => item.trim()).filter(Boolean) : [];
		return { ...entry, applicant_email: application?.applicant_email || "Unknown applicant", weekly_capacity: application?.weekly_capacity ?? null, timezone: application?.timezone ?? null, rate_requested: application?.rate_requested ?? null, platforms, campaign_title: role?.title || null };
	});
	return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-7xl"><Link href={`/dashboard/${companyId}`} className="text-3 text-accent-11 underline">Back to dashboard</Link><div className="my-6"><p className="text-3 uppercase tracking-[0.2em] text-gray-9">Ready for the next campaign</p><h1 className="text-8 font-bold text-gray-12">Roster / bench</h1><p className="mt-2 text-4 text-gray-10">People you can pull into the next campaign. This is not an employment roster.</p></div><Roster entries={mapped as never} campaigns={campaigns || []} /></div></main>;
}
