import Link from "next/link";
import { Button } from "@whop/react/components";
import { DashboardNav } from "@/components/dashboard-nav";
import { RolesList } from "@/components/roles-list";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function RolesPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase.from("workspaces").select("id").eq("whop_company_id", companyId).maybeSingle();
	if (!workspace) return null;
	const { data: roles } = await supabase.from("roles").select("id, title, type, description, status, capacity, intake_mode, seat_cap, platforms, pay_model, rate_offered, creator_name, niche, rules, start_date, deadline, applications(id, status)").eq("workspace_id", workspace.id).order("created_at", { ascending: false });
	const mapped = (roles || []).map((role) => ({ ...role, applicantCount: role.applications?.length || 0, seatsFilled: role.applications?.filter((item) => ["bench", "active", "paused"].includes(item.status)).length || 0 }));
	return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><DashboardNav companyId={companyId} /><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-3 uppercase tracking-[0.2em] text-gray-9">Pipelines</p><h1 className="text-8 font-bold text-gray-12">Roles</h1></div><Link href={`/dashboard/${companyId}/roles/new`}><Button size="3">Create role</Button></Link></div><RolesList roles={mapped as never} companyId={companyId} /></div></main>;
}
