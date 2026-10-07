import { headers } from "next/headers";
import { getWhopSdk } from "@/lib/whop-sdk";

export const CREWCALL_COMPANY_ID = "biz_zXEK1Sf9BNppBy";
export const CREWCALL_PRO_PRODUCT_ID = "prod_2i0TRvygPsApM";
export const CREWCALL_PRO_URL = "https://whop.com/crewcall/crewcall-pro/";
export const CREWCALL_MONTHLY_PLAN_ID = "plan_ecX3Szio5Pj63";
export const CREWCALL_ANNUAL_PLAN_ID = "plan_7omVbkAtzy7J0";
const CREWCALL_ACCESS_GATING_ENABLED = true;

/**
 * Checks whether the currently authenticated Whop user holds a valid
 * Crewcall Pro membership that should unlock the product.
 *
 * Memberships live under Crewcall's own company. We list by user_id +
 * plan_ids under CREWCALL_COMPANY_ID so the call never depends on the
 * installing company's reach (which caused the old users.checkAccess
 * 403 / "Access check unavailable" error).
 *
 * Access policy (strict — no unpaid grace):
 *   - trialing  → free trial still running
 *   - active    → paid and current
 *   - canceling → paid through current period, cancels at period end
 *
 * past_due, canceled, expired, unresolved → no access (paywall).
 * When a trial ends and the first charge fails, Whop moves the
 * membership to past_due; we intentionally do NOT grant access then.
 */
export async function hasCrewcallAccess() {
	const sdk = getWhopSdk();
	const { userId } = await sdk.verifyUserToken(await headers());

	if (!CREWCALL_ACCESS_GATING_ENABLED) {
		return { userId, hasAccess: true };
	}

	const memberships = await sdk.memberships.list({
		company_id: CREWCALL_COMPANY_ID,
		user_ids: [userId],
		plan_ids: [CREWCALL_MONTHLY_PLAN_ID, CREWCALL_ANNUAL_PLAN_ID],
		first: 10,
	});

	// Only statuses that mean the customer is in a paid/trial period.
	// Do NOT include past_due — that is failed payment / expired trial.
	const ACCESS_GRANTING_STATUSES = new Set(["active", "trialing", "canceling"]);

	const hasAccess = memberships.data.some((m) => {
		if (!ACCESS_GRANTING_STATUSES.has(m.status)) return false;

		// Safety: if Whop still reports trialing/active but the period
		// end is already in the past, treat as no access.
		const periodEnd =
			(m as { renewal_period_end?: string | null }).renewal_period_end ??
			(m as { current_period_end?: string | null }).current_period_end ??
			null;
		if (periodEnd) {
			const endMs = Date.parse(periodEnd);
			if (Number.isFinite(endMs) && endMs < Date.now()) {
				return false;
			}
		}

		return true;
	});

	return { userId, hasAccess };
}
