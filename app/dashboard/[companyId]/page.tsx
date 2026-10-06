import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "@whop/react/components";
import { DashboardNav } from "@/components/dashboard-nav";
import { RoleCard } from "@/components/role-card";
import { OnboardingForm } from "@/components/onboarding-form";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getWhopSdk } from "@/lib/whop-sdk";
import { isWorkspaceOnboarded } from "@/lib/workspace";

export default async function DashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const { userId } = await getWhopSdk().verifyUserToken(await headers());
	let greeting = "Welcome back";
	try {
		const user = await getWhopSdk().users.retrieve(userId);
		if (user.name || user.username) greeting = `Welcome back, ${user.name || user.username}`;
	} catch (error) {
		console.error("Could not load Whop display name:", error);
	}

	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase
		.from("workspaces")
		.select("id, hiring_type, name")
		.eq("whop_company_id", companyId)
		.maybeSingle();

	if (!isWorkspaceOnboarded(workspace)) {
		return (
			<main className="min-h-screen px-5 py-16">
				<OnboardingForm companyId={companyId} />
			</main>
		);
	}

	const [{ data: roles }, { count: benchSize }, { count: availableNow }] = await Promise.all([
		supabase
			.from("roles")
			.select(
				"id, title, type, description, status, capacity, intake_mode, seat_cap, platforms, pay_model, rate_offered, rate_currency, creator_name, niche, rules, start_date, deadline, applications(id, status), workspaces(name)",
			)
			.eq("workspace_id", workspace!.id)
			.order("created_at", { ascending: false }),
		supabase
			.from("roster_entries")
			.select("id", { count: "exact", head: true })
			.eq("workspace_id", workspace!.id)
			.neq("status", "dismissed"),
		supabase
			.from("roster_entries")
			.select("id", { count: "exact", head: true })
			.eq("workspace_id", workspace!.id)
			.eq("status", "bench"),
	]);
	const mapped = (roles || []).map((role) => ({
		...role,
		applicantCount: role.applications?.length || 0,
		seatsFilled:
			role.applications?.filter((item) => ["bench", "active", "paused"].includes(item.status))
				.length || 0,
	}));
	const openRoles = mapped.filter((role) => role.status === "open").length;
	const applicantsInReview = mapped.reduce(
		(total, role) =>
			total +
			(role.applications?.filter((item) =>
				["applied", "needs_info", "sample_requested", "test_sent", "test_submitted"].includes(
					item.status,
				),
			).length || 0),
		0,
	);
	const attentionRoles = mapped.filter(
		(role) =>
			role.status === "open" &&
			role.intake_mode === "limited_seats" &&
			role.seat_cap &&
			role.seatsFilled >= Math.max(role.seat_cap - 1, 1),
	);

	return (
		<main className="dashboard-shell">
			<div>
				<DashboardNav companyId={companyId} />

				<header className="page-header">
					<div>
						<p className="page-kicker">{greeting}</p>
						<h1 className="page-title">Crewcall home</h1>
						<p className="page-subtitle">Your hiring desk for building a ready bench.</p>
					</div>
					<Link href={`/dashboard/${companyId}/roles/new`} className="no-underline">
						<Button size="3">＋ Create role</Button>
					</Link>
				</header>

				{!mapped.length ? (
					<section className="premium-surface p-6 sm:p-8">
						<p className="page-kicker">Getting started</p>
						<h2 className="section-title mt-2">Get your first bench moving</h2>
						<p className="mt-2 text-3 text-gray-10">
							Three calm steps to open your first hiring pipeline.
						</p>
						<div className="mt-6 grid gap-3 md:grid-cols-3">
							<ChecklistStep
								number="1"
								title="Create your first role"
								hint="Start here"
								href={`/dashboard/${companyId}/roles/new`}
							/>
							<ChecklistStep number="2" title="Share the link" hint="Invite applicants" />
							<ChecklistStep number="3" title="Review your first applicant" hint="Build the bench" />
						</div>
					</section>
				) : (
					<div className="grid gap-8">
						<section className="premium-surface p-6 sm:p-8">
							<p className="page-kicker">Priority</p>
							<h2 className="section-title mt-2">Needs your attention</h2>
							<div className="mt-5 grid gap-3 sm:grid-cols-2">
								<Attention
									title="New applications waiting for review"
									value={applicantsInReview}
									href={`/dashboard/${companyId}/roles`}
								/>
								<Attention
									title="Tests overdue or awaiting review"
									value="Review queues"
									href={`/dashboard/${companyId}/roles`}
								/>
								<Attention
									title="Applicants waiting on a reply"
									value="Needs info"
									href={`/dashboard/${companyId}/roles`}
								/>
								<Attention
									title="Roles closing soon or nearly full"
									value={attentionRoles.length}
									href={`/dashboard/${companyId}/roles`}
								/>
							</div>
						</section>

						<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<Summary label="Open roles" value={openRoles} />
							<Summary label="Applicants in review" value={applicantsInReview} />
							<Summary label="Bench size" value={benchSize || 0} />
							<Summary label="Available now" value={availableNow || 0} />
						</section>

						<section className="premium-surface p-6 sm:p-8">
							<div className="mb-5 flex items-center justify-between gap-3">
								<div>
									<p className="page-kicker">Pipelines</p>
									<h2 className="section-title mt-1">Roles</h2>
								</div>
								<Link href={`/dashboard/${companyId}/roles`} className="button-link">
									View all →
								</Link>
							</div>
							<div className="grid gap-3">
								{mapped.slice(0, 5).map((role) => (
									<RoleCard key={role.id} role={role as never} companyId={companyId} />
								))}
							</div>
						</section>
					</div>
				)}
			</div>
		</main>
	);
}

function Summary({ label, value }: { label: string; value: number }) {
	return (
		<div className="metric-card">
			<p className="text-3 font-medium text-gray-9">{label}</p>
			<p className="mt-2 text-8 font-bold tabular-nums tracking-tight text-gray-12">{value}</p>
		</div>
	);
}

function Attention({
	title,
	value,
	href,
}: {
	title: string;
	value: string | number;
	href: string;
}) {
	return (
		<Link href={href} className="attention-card no-underline">
			<p className="text-3 font-semibold text-gray-12">{title}</p>
			<p className="mt-2 text-4 font-medium text-gray-11">
				{value} <span aria-hidden="true">→</span>
			</p>
		</Link>
	);
}

function ChecklistStep({
	number,
	title,
	hint,
	href,
}: {
	number: string;
	title: string;
	hint: string;
	href?: string;
}) {
	const content = (
		<div className="attention-card h-full">
			<span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-a5 bg-gray-1 text-3 font-bold text-gray-11">
				{number}
			</span>
			<p className="mt-4 text-4 font-semibold text-gray-12">{title}</p>
			<p className="mt-1 text-3 text-gray-9">{hint}</p>
		</div>
	);
	return href ? (
		<Link href={href} className="no-underline">
			{content}
		</Link>
	) : (
		content
	);
}
