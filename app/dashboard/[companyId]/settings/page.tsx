import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function SettingsPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const { data: workspace } = await getSupabaseAdmin().from("workspaces").select("whop_company_id, hiring_type").eq("whop_company_id", companyId).maybeSingle();
	return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><DashboardNav companyId={companyId} /><Link href={`/dashboard/${companyId}`} className="text-3 text-accent-11 underline">Back home</Link><div className="my-6"><p className="text-3 uppercase tracking-[0.2em] text-gray-9">Workspace</p><h1 className="text-8 font-bold text-gray-12">Settings</h1></div><section className="grid gap-4 rounded-3xl border border-gray-a5 bg-gray-a2 p-6"><div><p className="text-3 text-gray-9">Workspace name</p><p className="text-5 font-semibold text-gray-12">Crewcall workspace</p><p className="text-2 text-gray-9">Whop company: {workspace?.whop_company_id || companyId}</p></div><div><p className="text-3 text-gray-9">Hiring type</p><p className="text-5 font-semibold capitalize text-gray-12">{workspace?.hiring_type || "Not set"}</p></div></section></div></main>;
}
