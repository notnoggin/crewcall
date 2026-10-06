import Link from "next/link";
import { Button } from "@whop/react/components";
import { DashboardNav } from "@/components/dashboard-nav";
import { RolesList } from "@/components/roles-list";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function RolesPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase
		.from("workspaces")
		.select("id")
		.eq("whop_company_id", companyId)
		.maybeSingle();
	if (!workspace) return null;
	const { data: roles } = await supabase
		.from("roles")
		.select(
			"id, title, type, description, status, capacity, intake_mode, seat_cap, platforms, pay_model, rate_offered, rate_currency, creator_name, niche, rules, start_date, deadline, applications(id, status), workspaces(name)",
		)
		.eq("workspace_id", workspace.id)
		.order("created_at", { ascending: false });
	const mapped = (roles || []).map((role) => ({
		...role,
		applicantCount: role.applications?.length || 0,
		seatsFilled:
			role.applications?.filter((item) => ["bench", "active", "paused"].includes(item.status))
				.length || 0,
	}));

	return (
		<main className="dashboard-shell">
			<div>
				<DashboardNav companyId={companyId} />
				<header className="page-header">
					<div>
						<p className="page-kicker">Pipelines</p>
						<h1 className="page-title">Roles</h1>
						<p className="page-subtitle">Campaigns and seats, organized for action.</p>
					</div>
					<Link href={`/dashboard/${companyId}/roles/new`} className="no-underline">
						<Button size="3">＋ Create role</Button>
					</Link>
				</header>
				<RolesList roles={mapped as never} companyId={companyId} />
			</div>
		</main>
	);
}
