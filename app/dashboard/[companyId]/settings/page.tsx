import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";
import { SettingsForm } from "@/components/settings-form";
import { getSupabaseAdmin } from "@/lib/supabase";
import { headers } from "next/headers";
import { getWhopSdk } from "@/lib/whop-sdk";
import { CREWCALL_ANNUAL_PLAN_ID, CREWCALL_MONTHLY_PLAN_ID } from "@/lib/crewcall-access";

export default async function SettingsPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const { data: workspace } = await getSupabaseAdmin().from("workspaces").select("whop_company_id, name, hiring_type").eq("whop_company_id", companyId).maybeSingle();
	if (!workspace) return null;
	let membership: { planLabel: string; status: string; renewalPeriodEnd: string | null; manageUrl: string | null } | null = null;
	try {
		const { userId } = await getWhopSdk().verifyUserToken(await headers());
		const memberships = await getWhopSdk().memberships.list({ company_id: companyId, user_ids: [userId], plan_ids: [CREWCALL_MONTHLY_PLAN_ID, CREWCALL_ANNUAL_PLAN_ID], first: 10 });
		const current = memberships.data.find((item) => ["active", "trialing", "paused", "canceling"].includes(item.status));
		if (current) {
			membership = {
				planLabel: current.plan.id === CREWCALL_ANNUAL_PLAN_ID ? "Crewcall Pro · Annual" : "Crewcall Pro · Monthly",
				status: current.status,
				renewalPeriodEnd: current.renewal_period_end,
				manageUrl: current.manage_url,
			};
		}
	} catch (error) {
		console.error("Could not load Crewcall membership details:", error);
	}
	return <main className="dashboard-shell"><div className="max-w-5xl"><DashboardNav companyId={companyId} /><Link href={`/dashboard/${companyId}`} className="button-link">← Back home</Link><div className="my-8"><p className="page-kicker">Workspace</p><h1 className="page-title">Settings</h1><p className="page-subtitle">Make Crewcall feel like your hiring desk.</p></div><SettingsForm companyId={companyId} initialName={workspace.name || "Crewcall workspace"} initialHiringType={workspace.hiring_type} membership={membership} /></div></main>;
}
