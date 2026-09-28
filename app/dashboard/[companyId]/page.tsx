import { Button } from "@whop/react/components";
import { headers } from "next/headers";
import Link from "next/link";
import { OnboardingForm } from "@/components/onboarding-form";
import { RoleForm } from "@/components/role-form";
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
	const displayName = `@${userId}`;
	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase
		.from("workspaces")
		.select("id, hiring_type")
		.eq("whop_company_id", companyId)
		.maybeSingle();

	const { data: roles } = workspace
		? await supabase
				.from("roles")
				.select("id, title, type, description, capacity, status")
				.eq("workspace_id", workspace.id)
				.order("created_at", { ascending: false })
		: { data: null };

	if (!workspace || !roles?.length) {
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
						<p className="text-3 text-gray-10">Welcome back, {displayName}</p>
						<h1 className="text-9 font-bold text-gray-12">Your hiring pipeline</h1>
					</div>
					<Link href="https://docs.whop.com/apps" target="_blank">
						<Button variant="classic" size="3">Whop docs</Button>
					</Link>
				</div>
				<div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
					<section className="rounded-3xl border border-gray-a5 bg-gray-a2 p-6">
						<h2 className="mb-1 text-6 font-bold text-gray-12">Create a role</h2>
						<p className="mb-6 text-3 text-gray-10">Open a new pipeline for your next hire.</p>
						<RoleForm workspaceId={workspace.id} />
					</section>
					<section>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-6 font-bold text-gray-12">Roles</h2>
							<span className="text-3 text-gray-9">{roles?.length || 0} total</span>
						</div>
						<div className="grid gap-3">
							{roles?.map((role) => (
								<article key={role.id} className="rounded-2xl border border-gray-a5 bg-gray-a2 p-5">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h3 className="text-5 font-semibold text-gray-12">{role.title}</h3>
											<p className="mt-1 text-3 text-gray-10">{role.type} · hiring {role.capacity}</p>
										</div>
										<span className="rounded-full bg-green-a3 px-3 py-1 text-2 font-semibold uppercase text-green-11">{role.status}</span>
									</div>
									{role.description && <p className="mt-4 text-3 text-gray-10">{role.description}</p>}
									{role.status === "open" && (
										<div className="mt-4 flex gap-4">
											<Link className="text-3 font-semibold text-accent-11 underline" href={`/apply/${role.id}`}>Copy application link</Link>
											<Link className="text-3 font-semibold text-accent-11 underline" href={`/dashboard/${companyId}/roles/${role.id}`}>Review queue</Link>
										</div>
									)}
								</article>
							))}
							{!roles?.length && <p className="rounded-2xl border border-dashed border-gray-a6 p-8 text-center text-4 text-gray-9">Create your first role to start accepting applications.</p>}
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}
