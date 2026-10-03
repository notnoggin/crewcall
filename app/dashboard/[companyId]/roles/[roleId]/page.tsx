import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewQueue } from "@/components/review-queue";
import { DashboardNav } from "@/components/dashboard-nav";
import { RoleSharePanel, type Role } from "@/components/role-card";
import { RoleActions } from "@/components/role-actions";
import { expireOverdueTests } from "@/lib/review-queue";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function RoleQueuePage({
	params,
	searchParams,
}: {
	params: Promise<{ companyId: string; roleId: string }>;
	searchParams?: Promise<{ share?: string }>;
}) {
	const { companyId, roleId } = await params;
	const query = await searchParams;
	const supabase = getSupabaseAdmin();
	let { data: role, error: roleError } = await supabase
		.from("roles")
		.select("id, title, type, description, status, capacity, intake_mode, seat_cap, platforms, pay_model, rate_offered, rate_currency, active_fields, creator_name, niche, rules, start_date, deadline, workspace_id, workspaces!inner(whop_company_id, name)")
		.eq("id", roleId)
		.eq("workspaces.whop_company_id", companyId)
		.maybeSingle();
	if (roleError && /active_fields/i.test(roleError.message)) {
		const retry = await supabase.from("roles").select("id, title, type, description, status, capacity, intake_mode, seat_cap, platforms, pay_model, rate_offered, creator_name, niche, rules, start_date, deadline, workspace_id, workspaces!inner(whop_company_id, name)").eq("id", roleId).eq("workspaces.whop_company_id", companyId).maybeSingle();
		role = retry.data ? { ...retry.data, rate_currency: null, active_fields: null } : null;
		roleError = retry.error;
	}
	if (!role) notFound();
	await expireOverdueTests(supabase, roleId);

	let { data: applications, error: applicationsError } = await supabase
		.from("applications")
		.select("id, applicant_email, applicant_whop_id, answers, sample_links, weekly_capacity, timezone, rate_requested, rate_currency, score, notes, status, roles!inner(workspace_id, type, title, rate_offered, rate_currency, active_fields), tests(id, brief, paid, pay_amount, due_at, outcome)")
		.eq("role_id", roleId)
		.order("created_at", { ascending: true });
	if (applicationsError && /active_fields/i.test(applicationsError.message)) {
		const retry = await supabase.from("applications").select("id, applicant_email, applicant_whop_id, answers, sample_links, weekly_capacity, timezone, rate_requested, rate_currency, score, notes, status, roles!inner(workspace_id, type, title, rate_offered, rate_currency), tests(id, brief, paid, pay_amount, due_at, outcome)").eq("role_id", roleId).order("created_at", { ascending: true });
		applications = retry.data as typeof applications;
		applicationsError = retry.error;
	}
	if (applicationsError) throw new Error(applicationsError.message);

	return (
		<main className="dashboard-shell overflow-x-auto">
			<div className="max-w-[1600px]">
				<DashboardNav companyId={companyId} />
				<Link href={`/dashboard/${companyId}`} className="button-link">← Back to dashboard</Link>
				<div className="my-8">
					<p className="page-kicker">{role.type} · review queue</p>
					<h1 className="page-title">{role.title}</h1>
				</div>
				<RoleActions roleId={role.id} title={role.title} status={role.status} rolesPath={`/dashboard/${companyId}/roles`} />
				{query?.share === "1" && <RoleSharePanel role={role as unknown as Role} />}
				<ReviewQueue applications={(applications || []) as never} />
			</div>
		</main>
	);
}
