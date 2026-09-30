import { headers } from "next/headers";
import { getWhopSdk } from "@/lib/whop-sdk";

export const CREWCALL_PRO_PRODUCT_ID = "prod_2i0TRvygPsApM";
export const CREWCALL_PRO_URL = "https://whop.com/crewcall/crewcall-pro/";

export async function hasCrewcallAccess() {
	const sdk = getWhopSdk();
	const { userId } = await sdk.verifyUserToken(await headers());
	const access = await sdk.users.checkAccess(CREWCALL_PRO_PRODUCT_ID, { id: userId });
	return { userId, hasAccess: access.has_access };
}
