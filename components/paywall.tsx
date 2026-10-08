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
	/** Primary action URL */
	ctaUrl: string;
	/** Secondary / manage billing */
	manageUrl?: string;
};

export function Paywall({ kind, workspaceName, ctaUrl, manageUrl }: PaywallProps) {
	const workspaceLabel = workspaceName?.trim() || "your workspace";
	const subscribeUrl = ctaUrl || CREWCALL_PRO_URL;

	if (kind === "payment_failed") {
		return (
			<main className="paywall-page">
				<div className="paywall-shell">
					<Brand />
					<div className="paywall-hero">
						<p className="paywall-kicker">Payment issue</p>
						<h1 className="paywall-title">
							Update your payment method
							<br />
							to keep using Crewcall.
						</h1>
						<p className="paywall-lede">
							Your last renewal for {workspaceLabel} didn&apos;t go through. Fix the card on file
							and access returns automatically — your roles and bench stay saved.
						</p>
					</div>

					<div className="paywall-offer">
						<div className="paywall-offer-header">
							<p className="paywall-offer-badge">Action needed</p>
						</div>

						<Link
							href={manageUrl || subscribeUrl}
							target="_blank"
							rel="noreferrer"
							className="paywall-cta"
						>
							Update payment method
						</Link>

						<p className="paywall-fineprint">
							Prefer a different plan?{" "}
							<a href={CREWCALL_PRO_URL} target="_blank" rel="noreferrer" className="paywall-text-link">
								View plans
							</a>
							. Whop may also retry the charge automatically.
						</p>
					</div>
				</div>
			</main>
		);
	}

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
							Subscribe to keep going.
						</h1>
						<p className="paywall-lede">
							{workspaceLabel} is still here — roles, applicants, and your bench. Pick a plan to
							restore full access.
						</p>
					</div>

					<div className="paywall-offer">
						<div className="paywall-offer-header">
							<p className="paywall-offer-badge">Continue with Pro</p>
							<p className="paywall-offer-price">
								<span className="paywall-offer-amount">$29.99</span>
								<span className="paywall-offer-period">/month</span>
							</p>
							<p className="paywall-offer-alt">or $279.99/year · cancel anytime</p>
						</div>

						<Link href={subscribeUrl} target="_blank" rel="noreferrer" className="paywall-cta">
							Choose a plan
						</Link>

						<p className="paywall-fineprint">
							Opens Crewcall Pro checkout on Whop. After you subscribe, refresh this page to
							continue.
						</p>
					</div>
				</div>
			</main>
		);
	}

	if (kind === "canceled") {
		return (
			<main className="paywall-page">
				<div className="paywall-shell">
					<Brand />
					<div className="paywall-hero">
						<p className="paywall-kicker">Subscription ended</p>
						<h1 className="paywall-title">
							Welcome back.
							<br />
							Resubscribe to reopen your desk.
						</h1>
						<p className="paywall-lede">
							Your previous plan for {workspaceLabel} is no longer active. Your data is safe —
							subscribe again to get back in.
						</p>
					</div>

					<div className="paywall-offer">
						<div className="paywall-offer-header">
							<p className="paywall-offer-badge">Resubscribe</p>
							<p className="paywall-offer-price">
								<span className="paywall-offer-amount">$29.99</span>
								<span className="paywall-offer-period">/month</span>
							</p>
							<p className="paywall-offer-alt">or $279.99/year · cancel anytime</p>
						</div>

						<Link href={subscribeUrl} target="_blank" rel="noreferrer" className="paywall-cta">
							View plans &amp; subscribe
						</Link>

						<p className="paywall-fineprint">
							After checkout, return here and refresh. Access unlocks as soon as Whop confirms
							your membership.
						</p>
					</div>
				</div>
			</main>
		);
	}

	// kind === "new"
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

					<Link href={subscribeUrl} target="_blank" rel="noreferrer" className="paywall-cta">
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
