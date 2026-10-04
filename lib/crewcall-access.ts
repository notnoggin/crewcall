import { headers } from "next/headers";
import { getWhopSdk } from "@/lib/whop-sdk";

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
	const access = await sdk.users.checkAccess(CREWCALL_PRO_PRODUCT_ID, { id: userId });
	return { userId, hasAccess: access.has_access };
}
