import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";
import { SettingsForm } from "@/components/settings-form";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function SettingsPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const { data: workspace } = await getSupabaseAdmin().from("workspaces").select("whop_company_id, name, hiring_type").eq("whop_company_id", companyId).maybeSingle();
	if (!workspace) return null;
	return <main className="dashboard-shell"><div className="max-w-5xl"><DashboardNav companyId={companyId} /><Link href={`/dashboard/${companyId}`} className="button-link">← Back home</Link><div className="my-8"><p className="page-kicker">Workspace</p><h1 className="page-title">Settings</h1><p className="page-subtitle">Make Crewcall feel like your hiring desk.</p></div><SettingsForm companyId={companyId} initialName={workspace.name || "Crewcall workspace"} initialHiringType={workspace.hiring_type} /></div></main>;
}
