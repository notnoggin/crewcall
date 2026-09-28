import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { RoleForm } from "@/components/role-form";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function NewRolePage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const { data: workspace } = await getSupabaseAdmin().from("workspaces").select("id, hiring_type").eq("whop_company_id", companyId).maybeSingle();
	if (!workspace) notFound();
	return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-3xl"><DashboardNav companyId={companyId} /><Link href={`/dashboard/${companyId}`} className="text-3 text-accent-11 underline">Back home</Link><div className="my-6"><p className="text-3 uppercase tracking-[0.2em] text-gray-9">New role</p><h1 className="text-8 font-bold text-gray-12">Create a role</h1><p className="mt-2 text-4 text-gray-10">Set up a hiring pipeline and share it with applicants.</p></div><section className="rounded-3xl border border-gray-a5 bg-gray-a2 p-6 sm:p-8"><RoleForm workspaceId={workspace.id} companyId={companyId} defaultType={workspace.hiring_type} /></section></div></main>;
}
