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
 * Crewcall Pro membership (active, trialing, canceling, or past_due).
 *
 * Memberships live under Crewcall's own company. We deliberately list
 * by user_id + plan_ids under CREWCALL_COMPANY_ID so the call never
 * depends on the installing company's reach (which caused the old
 * users.checkAccess 403 / "Access check unavailable" error).
 *
 * Flow contract used by the dashboard layout:
 *   1. No workspace yet  → onboarding is shown (gate is skipped).
 *   2. Workspace exists  → this function runs; no access → paywall.
 *   3. Has access        → full dashboard.
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

	// Whop grants access for these statuses until the period actually ends.
	const ACCESS_GRANTING_STATUSES = new Set([
		"active",
		"trialing",
		"canceling",
		"past_due",
	]);

	const hasAccess = memberships.data.some((m) =>
		ACCESS_GRANTING_STATUSES.has(m.status),
	);

	return { userId, hasAccess };
}
