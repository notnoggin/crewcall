import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewQueue } from "@/components/review-queue";
import { expireOverdueTests } from "@/lib/review-queue";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function RoleQueuePage({
	params,
}: {
	params: Promise<{ companyId: string; roleId: string }>;
}) {
	const { companyId, roleId } = await params;
	const supabase = getSupabaseAdmin();
	const { data: role } = await supabase
		.from("roles")
		.select("id, title, type, workspace_id, workspaces!inner(whop_company_id)")
		.eq("id", roleId)
		.eq("workspaces.whop_company_id", companyId)
		.maybeSingle();
	if (!role) notFound();
	await expireOverdueTests(supabase, roleId);

	const { data: applications } = await supabase
		.from("applications")
		.select("id, applicant_email, applicant_whop_id, answers, sample_links, weekly_capacity, timezone, rate_requested, score, notes, status, roles!inner(workspace_id, type, title, rate_offered), tests(id, brief, paid, pay_amount, due_at, outcome)")
		.eq("role_id", roleId)
		.order("created_at", { ascending: true });

	return (
		<main className="min-h-screen overflow-x-auto px-5 py-8 sm:px-8">
			<div className="mx-auto max-w-[1600px]">
				<Link href={`/dashboard/${companyId}`} className="text-3 text-accent-11 underline">Back to dashboard</Link>
				<div className="my-6">
					<p className="text-3 uppercase tracking-[0.2em] text-gray-9">{role.type}</p>
					<h1 className="text-8 font-bold text-gray-12">{role.title} review queue</h1>
				</div>
				<ReviewQueue applications={(applications || []) as never} />
			</div>
		</main>
	);
}
