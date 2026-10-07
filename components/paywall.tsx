import Link from "next/link";
import { CREWCALL_PRO_URL, type PaywallKind } from "@/lib/crewcall-access";

const NEW_FEATURES = [
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

function CheckIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
			<path
				d="M3.5 8.5L6.5 11.5L12.5 4.5"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function Brand() {
	return (
		<div className="paywall-brand">
			<div className="crewcall-logo-chip paywall-logo">
				<img src="/crewcall-logo-modified.png" alt="Crewcall" className="h-full w-full object-contain" />
			</div>
			<span className="paywall-brand-name">Crewcall Pro</span>
		</div>
	);
}

type PaywallProps = {
	kind: PaywallKind;
	workspaceName?: string | null;
	manageUrl: string;
};

export function Paywall({ kind, workspaceName, manageUrl }: PaywallProps) {
	const workspaceLabel = workspaceName?.trim() || "your workspace";

	if (kind === "trial_ended") {
		return (
			<main className="paywall-page">
				<div className="paywall-shell">
					<Brand />
					<div className="paywall-hero">
						<p className="paywall-kicker">Trial ended</p>
						<h1 className="paywall-title">
							Your trial has ended.
							<br />
							Fix payment to keep going.
						</h1>
						<p className="paywall-lede">
							We couldn&apos;t charge your card after the free trial for {workspaceLabel}.
							Update your payment method to restore full access to roles, applicants, and your
							bench.
						</p>
					</div>

					<div className="paywall-offer">
						<div className="paywall-offer-header">
							<p className="paywall-offer-badge">Payment required</p>
							<p className="paywall-offer-price">
								<span className="paywall-offer-amount">$29.99</span>
								<span className="paywall-offer-period">/month</span>
							</p>
							<p className="paywall-offer-alt">or $279.99/year · cancel anytime</p>
						</div>

						<Link href={manageUrl || CREWCALL_PRO_URL} target="_blank" rel="noreferrer" className="paywall-cta">
							Fix payment method
						</Link>

						<p className="paywall-fineprint">
							Once payment succeeds, access returns automatically. Your workspace data is still
							here.
						</p>
					</div>
				</div>
			</main>
		);
	}

	if (kind === "payment_failed") {
		return (
			<main className="paywall-page">
				<div className="paywall-shell">
					<Brand />
					<div className="paywall-hero">
						<p className="paywall-kicker">Payment issue</p>
						<h1 className="paywall-title">
							Fix your payment method
							<br />
							to keep using Crewcall.
						</h1>
						<p className="paywall-lede">
							Your last renewal for {workspaceLabel} didn&apos;t go through. Update the card on
							file so your hiring desk stays open.
						</p>
					</div>

					<div className="paywall-offer">
						<div className="paywall-offer-header">
							<p className="paywall-offer-badge">Action needed</p>
							<p className="paywall-offer-alt" style={{ marginTop: 8 }}>
								Roles, applicants, and your bench stay saved. Access resumes as soon as payment
								succeeds.
							</p>
						</div>

						<Link href={manageUrl || CREWCALL_PRO_URL} target="_blank" rel="noreferrer" className="paywall-cta">
							Update payment method
						</Link>

						<p className="paywall-fineprint">
							Manage billing anytime at Whop → Memberships. Whop may also retry the charge
							automatically.
						</p>
					</div>
				</div>
			</main>
		);
	}

	// kind === "new" — first-time conversion
	return (
		<main className="paywall-page">
			<div className="paywall-shell">
				<Brand />

				<div className="paywall-hero">
					<p className="paywall-kicker">{workspaceLabel} is ready</p>
					<h1 className="paywall-title">
						Hire with a desk
						<br />
						built for speed.
					</h1>
					<p className="paywall-lede">
						Open roles, review applicants, and keep a bench you can pull from — all in one place.
						Start free for 3 days.
					</p>
				</div>

				<ul className="paywall-features">
					{NEW_FEATURES.map((feature) => (
						<li key={feature.title} className="paywall-feature">
							<span className="paywall-feature-mark">
								<CheckIcon />
							</span>
							<div>
								<p className="paywall-feature-title">{feature.title}</p>
								<p className="paywall-feature-body">{feature.body}</p>
							</div>
						</li>
					))}
				</ul>

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
						No charge today. Full access for 3 days. Cancel before it ends and you won&apos;t be
						billed.
					</p>
				</div>
			</div>
		</main>
	);
}
