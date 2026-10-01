import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { RoleForm } from "@/components/role-form";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function NewRolePage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const { data: workspace } = await getSupabaseAdmin().from("workspaces").select("id, hiring_type").eq("whop_company_id", companyId).maybeSingle();
	if (!workspace) notFound();
	return <main className="dashboard-shell"><div className="max-w-4xl"><DashboardNav companyId={companyId} /><Link href={`/dashboard/${companyId}`} className="button-link">← Back home</Link><div className="my-8"><p className="page-kicker">New role</p><h1 className="page-title">Create a role</h1><p className="page-subtitle">Set up a hiring pipeline and share it with applicants.</p></div><section className="premium-surface p-6 sm:p-8"><RoleForm workspaceId={workspace.id} companyId={companyId} defaultType={workspace.hiring_type} /></section></div></main>;
}
