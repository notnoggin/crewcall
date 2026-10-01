import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";
import { SettingsForm } from "@/components/settings-form";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function SettingsPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const { data: workspace } = await getSupabaseAdmin().from("workspaces").select("whop_company_id, name, hiring_type").eq("whop_company_id", companyId).maybeSingle();
	if (!workspace) return null;
	return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><DashboardNav companyId={companyId} /><Link href={`/dashboard/${companyId}`} className="button-link">← Back home</Link><div className="my-6"><p className="text-3 uppercase tracking-[0.2em] text-gray-9">Workspace</p><h1 className="text-8 font-bold text-gray-12">Settings</h1></div><section className="premium-surface rounded-3xl p-6"><SettingsForm companyId={companyId} initialName={workspace.name || "Crewcall workspace"} initialHiringType={workspace.hiring_type} /></section></div></main>;
}
