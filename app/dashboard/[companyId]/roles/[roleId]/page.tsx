import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewQueue } from "@/components/review-queue";
import { DashboardNav } from "@/components/dashboard-nav";
import { RoleSharePanel, type Role } from "@/components/role-card";
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
	const { data: role } = await supabase
		.from("roles")
		.select("id, title, type, description, status, capacity, intake_mode, seat_cap, platforms, pay_model, rate_offered, rate_currency, active_fields, creator_name, niche, rules, start_date, deadline, workspace_id, workspaces!inner(whop_company_id, name)")
		.eq("id", roleId)
		.eq("workspaces.whop_company_id", companyId)
		.maybeSingle();
	if (!role) notFound();
	await expireOverdueTests(supabase, roleId);

	const { data: applications } = await supabase
		.from("applications")
		.select("id, applicant_email, applicant_whop_id, answers, sample_links, weekly_capacity, timezone, rate_requested, rate_currency, score, notes, status, roles!inner(workspace_id, type, title, rate_offered, rate_currency, active_fields), tests(id, brief, paid, pay_amount, due_at, outcome)")
		.eq("role_id", roleId)
		.order("created_at", { ascending: true });

	return (
		<main className="min-h-screen overflow-x-auto px-5 py-8 sm:px-8">
			<div className="mx-auto max-w-[1600px]">
				<DashboardNav companyId={companyId} />
				<Link href={`/dashboard/${companyId}`} className="button-link">← Back to dashboard</Link>
				<div className="my-6">
					<p className="text-3 uppercase tracking-[0.2em] text-gray-9">{role.type}</p>
					<h1 className="text-8 font-bold text-gray-12">{role.title} review queue</h1>
				</div>
				{query?.share === "1" && <RoleSharePanel role={role as unknown as Role} />}
				<ReviewQueue applications={(applications || []) as never} />
			</div>
		</main>
	);
}
