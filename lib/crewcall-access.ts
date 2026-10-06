import { headers } from "next/headers";
import { getWhopSdk } from "@/lib/whop-sdk";

export const CREWCALL_COMPANY_ID = "biz_zXEK1Sf9BNppBy";
export const CREWCALL_PRO_PRODUCT_ID = "prod_2i0TRvygPsApM";
export const CREWCALL_PRO_URL = "https://whop.com/crewcall/crewcall-pro/";
export const CREWCALL_MONTHLY_PLAN_ID = "plan_ecX3Szio5Pj63";
export const CREWCALL_ANNUAL_PLAN_ID = "plan_7omVbkAtzy7J0";
const CREWCALL_ACCESS_GATING_ENABLED = true;

export async function hasCrewcallAccess() {
	const sdk = getWhopSdk();
	const { userId } = await sdk.verifyUserToken(await headers());
	if (!CREWCALL_ACCESS_GATING_ENABLED) {
		return { userId, hasAccess: true };
	}
	// users.checkAccess() returns a 403 for users outside the business that owns this app
	// ("reach" is scoped to the app's own company, not every company it's installed into).
	// A membership to Crewcall Pro is a record under CREWCALL's own company (regardless of
	// which business the buyer belongs to), so we list memberships scoped to our own
	// company_id (required by Whop's API for API-key auth) and filter to this user + plans.
	// This is NOT "list every member of the installing business" — it only returns people
	// who hold a membership to a product Crewcall itself sells.
	const memberships = await sdk.memberships.list({
		company_id: CREWCALL_COMPANY_ID,
		user_ids: [userId],
		plan_ids: [CREWCALL_MONTHLY_PLAN_ID, CREWCALL_ANNUAL_PLAN_ID],
		first: 10,
	});
	// Per Whop's own access-granting definition: active, trialing, canceling (access lasts until
	// period end), and past_due (grace period after a failed payment) all still grant access.
	const ACCESS_GRANTING_STATUSES = new Set(["active", "trialing", "canceling", "past_due"]);
	const hasAccess = memberships.data.some((m) => ACCESS_GRANTING_STATUSES.has(m.status));
	return { userId, hasAccess };
}
