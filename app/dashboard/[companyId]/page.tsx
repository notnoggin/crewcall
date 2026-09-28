import { Button } from "@whop/react/components";
import { headers } from "next/headers";
import Link from "next/link";
import { OnboardingForm } from "@/components/onboarding-form";
import { RoleForm } from "@/components/role-form";
import { RoleCard } from "@/components/role-card";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getWhopSdk } from "@/lib/whop-sdk";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	const whopsdk = getWhopSdk();
	// Ensure the user is logged in on whop.
	const { userId } = await whopsdk.verifyUserToken(await headers());
	let displayName = "Welcome back";
	try {
		const user = await whopsdk.users.retrieve(userId);
		if (user.name || user.username) displayName = `Welcome back, ${user.name || user.username}`;
	} catch (error) {
		console.error("Could not load Whop display name:", error);
	}
	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase
		.from("workspaces")
		.select("id, hiring_type")
		.eq("whop_company_id", companyId)
		.maybeSingle();

	const { data: roles } = workspace
		? await supabase
				.from("roles")
				.select("id, title, type, description, capacity, status, intake_mode, seat_cap, platforms, pay_model, rate_offered, creator_name, niche, rules, start_date, deadline")
				.eq("workspace_id", workspace.id)
				.order("created_at", { ascending: false })
		: { data: null };

	if (!workspace) {
		return (
			<main className="min-h-screen px-5 py-16">
				<OnboardingForm companyId={companyId} />
			</main>
		);
	}

	return (
		<main className="min-h-screen px-5 py-10 sm:px-8">
			<div className="mx-auto max-w-5xl">
				<div className="mb-10 flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="text-3 text-gray-10">{displayName}</p>
						<h1 className="text-9 font-bold text-gray-12">Your hiring pipeline</h1>
					</div>
					<Link href="https://docs.whop.com/apps" target="_blank">
						<Button variant="classic" size="3">Whop docs</Button>
					</Link>
					<Link href={`/dashboard/${companyId}/roster`} className="text-3 font-semibold text-accent-11 underline">
						Open bench
					</Link>
				</div>
				<div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
					<section className="rounded-3xl border border-gray-a5 bg-gray-a2 p-6">
						<h2 className="mb-1 text-6 font-bold text-gray-12">Create a role</h2>
						<p className="mb-6 text-3 text-gray-10">Open a new pipeline for your next hire.</p>
						<RoleForm workspaceId={workspace.id} defaultType={workspace.hiring_type} />
					</section>
					<section>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-6 font-bold text-gray-12">Roles</h2>
							<span className="text-3 text-gray-9">{roles?.length || 0} total</span>
						</div>
						<div className="grid gap-3">
							{roles?.map((role) => <RoleCard key={role.id} role={role as never} companyId={companyId} onChanged={() => window.location.reload()} />)}
							{!roles?.length && <p className="rounded-2xl border border-dashed border-gray-a6 p-8 text-center text-4 text-gray-9">Create your first role to start accepting applications.</p>}
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}
