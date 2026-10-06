import Link from "next/link";
import { hasCrewcallAccess, CREWCALL_PRO_URL } from "@/lib/crewcall-access";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isWorkspaceOnboarded } from "@/lib/workspace";

const PAYWALL_FEATURES = [
	{
		title: "Role templates",
		body: "Clipper, moderator, VA, and custom flows — ready the moment you need them.",
	},
	{
		title: "Review queue",
		body: "Every application in one desk. Decide fast, keep nothing lost.",
	},
	{
		title: "Your bench",
		body: "Approved people on standby for the next campaign, not buried in DMs.",
	},
	{
		title: "Shareable links",
		body: "One link per role. Applicants apply where you already work.",
	},
] as const;

export default async function DashboardLayout({
	children,
	params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ companyId: string }> }>) {
	try {
		const { companyId } = await params;

		const { data: workspace } = await getSupabaseAdmin()
			.from("workspaces")
			.select("id, name")
			.eq("whop_company_id", companyId)
			.maybeSingle();

		// Only gate after the user has completed onboarding (set a real workspace name).
		// Default DB name "Crewcall workspace" means they have NOT onboarded yet.
		if (!isWorkspaceOnboarded(workspace)) {
			return children;
		}

		const { hasAccess } = await hasCrewcallAccess();

		if (!hasAccess) {
			const workspaceLabel = workspace?.name?.trim() || "your workspace";

			return (
				<main className="paywall-page">
					<div className="paywall-shell">
						{/* Brand mark */}
						<div className="paywall-brand">
							<div className="crewcall-logo-chip paywall-logo">
								<img
									src="/crewcall-logo-modified.png"
									alt="Crewcall"
									className="h-full w-full object-contain"
								/>
							</div>
							<span className="paywall-brand-name">Crewcall Pro</span>
						</div>

						{/* Hero */}
						<div className="paywall-hero">
							<p className="paywall-kicker">{workspaceLabel} is ready</p>
							<h1 className="paywall-title">
								Hire with a desk
								<br />
								built for speed.
							</h1>
							<p className="paywall-lede">
								Open roles, review applicants, and keep a bench you can pull from —
								all in one place. Start free for 3 days.
							</p>
						</div>

						{/* Features */}
						<ul className="paywall-features">
							{PAYWALL_FEATURES.map((feature) => (
								<li key={feature.title} className="paywall-feature">
									<span className="paywall-feature-mark" aria-hidden="true">
										<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
											<path
												d="M3.5 8.5L6.5 11.5L12.5 4.5"
												stroke="currentColor"
												strokeWidth="1.75"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</span>
									<div>
										<p className="paywall-feature-title">{feature.title}</p>
										<p className="paywall-feature-body">{feature.body}</p>
									</div>
								</li>
							))}
						</ul>

						{/* Offer card */}
						<div className="paywall-offer">
							<div className="paywall-offer-header">
								<p className="paywall-offer-badge">3-day free trial</p>
								<p className="paywall-offer-price">
									<span className="paywall-offer-amount">$29.99</span>
									<span className="paywall-offer-period">/month after</span>
								</p>
								<p className="paywall-offer-alt">or $279.99/year · cancel anytime</p>
							</div>

							<Link href={CREWCALL_PRO_URL} target="_blank" rel="noreferrer" className="paywall-cta">
								Start free trial
							</Link>

							<p className="paywall-fineprint">
								No charge today. Full access for 3 days. Cancel before it ends and you
								won&apos;t be billed.
							</p>
						</div>
					</div>
				</main>
			);
		}
	} catch (error) {
		console.error("Crewcall access check failed:", error);
		// Fail open to the page (onboarding) rather than blocking the whole app.
		return children;
	}

	return children;
}
