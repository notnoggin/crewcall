import { CREWCALL_PRO_URL, FREE_BENCH_LIMIT, FREE_ROLE_LIMIT } from "@/lib/crewcall-access";

export function FreeTierBanner() {
	return (
		<aside className="free-tier-banner">
			<div>
				<p className="free-tier-kicker">Free plan</p>
				<p className="free-tier-copy">
					{FREE_ROLE_LIMIT} role · {FREE_BENCH_LIMIT} people on the bench. Upgrade for unlimited
					roles, a full bench, and CSV import.
				</p>
			</div>
			<a href={CREWCALL_PRO_URL} target="_blank" rel="noreferrer" className="free-tier-cta">
				Upgrade to Pro
			</a>
		</aside>
	);
}
