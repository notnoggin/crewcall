import { headers } from "next/headers";
import { getWhopSdk } from "@/lib/whop-sdk";

export const CREWCALL_COMPANY_ID = "biz_zXEK1Sf9BNppBy";
export const CREWCALL_PRO_PRODUCT_ID = "prod_2i0TRvygPsApM";
export const CREWCALL_PRO_URL = "https://whop.com/crewcall/crewcall-pro/";
export const CREWCALL_MANAGE_URL = "https://whop.com/@me/settings/memberships";
/** New monthly plan with 3-day trial (old plan_ecX3Szio5Pj63 is archived). */
export const CREWCALL_MONTHLY_PLAN_ID = "plan_hqMX3rPUdXZ4K";
export const CREWCALL_ANNUAL_PLAN_ID = "plan_7omVbkAtzy7J0";

/** Free tier limits. Pro is unlimited. */
export const FREE_ROLE_LIMIT = 1;
export const FREE_BENCH_LIMIT = 5;

/** Always-on founder access for demos (your Whop user). */
const FOUNDER_USER_IDS = new Set(["user_SX0PVtcb4LM15"]);

const CREWCALL_ACCESS_GATING_ENABLED = true;

export type PaywallKind = "new" | "trial_ended" | "canceled" | "payment_failed";
export type AccessTier = "free" | "pro";

export type AccessResult = {
	userId: string;
	/** True when the user can open the app (free or pro). False only for past_due. */
	hasAccess: boolean;
	tier: AccessTier;
	isPro: boolean;
	paywallKind: PaywallKind;
	ctaUrl: string;
	manageUrl: string;
};

type MembershipRow = {
	id: string;
	status: string;
	renewal_period_end?: string | null;
	current_period_end?: string | null;
	manage_url?: string | null;
	plan?: { id?: string } | null;
	product?: { id?: string } | null;
	product_id?: string | null;
	plan_id?: string | null;
};

function periodEndMs(m: MembershipRow): number | null {
	const raw = m.renewal_period_end ?? m.current_period_end ?? null;
	if (!raw) return null;
	const ms = Date.parse(raw);
	return Number.isFinite(ms) ? ms : null;
}

function isPeriodStillValid(m: MembershipRow): boolean {
	const end = periodEndMs(m);
	if (end === null) return true;
	return end >= Date.now();
}

function freeAccess(userId: string, paywallKind: PaywallKind = "new"): AccessResult {
	return {
		userId,
		hasAccess: true,
		tier: "free",
		isPro: false,
		paywallKind,
		ctaUrl: CREWCALL_PRO_URL,
		manageUrl: CREWCALL_MANAGE_URL,
	};
}

function proAccess(userId: string, manageUrl?: string | null): AccessResult {
	return {
		userId,
		hasAccess: true,
		tier: "pro",
		isPro: true,
		paywallKind: "new",
		ctaUrl: CREWCALL_PRO_URL,
		manageUrl: manageUrl || CREWCALL_MANAGE_URL,
	};
}

/**
 * Free tier by default so people can try Crewcall without a card.
 * Pro when membership is active | trialing | canceling and the period is still valid.
 * past_due still blocks until the payment is fixed.
 */
export async function hasCrewcallAccess(): Promise<AccessResult> {
	const sdk = getWhopSdk();
	const { userId } = await sdk.verifyUserToken(await headers());

	if (FOUNDER_USER_IDS.has(userId)) {
		return proAccess(userId);
	}

	if (!CREWCALL_ACCESS_GATING_ENABLED) {
		return proAccess(userId);
	}

	const memberships = await sdk.memberships.list({
		company_id: CREWCALL_COMPANY_ID,
		user_ids: [userId],
		first: 20,
	});

	const rows = (memberships.data as MembershipRow[]) ?? [];
	const ACCESS_GRANTING = new Set(["active", "trialing", "canceling", "completed"]);

	const valid = rows.find((m) => ACCESS_GRANTING.has(m.status) && isPeriodStillValid(m));
	if (valid) {
		return proAccess(userId, valid.manage_url);
	}

	const pastDue = rows.find((m) => m.status === "past_due");
	if (pastDue) {
		return {
			userId,
			hasAccess: false,
			tier: "free",
			isPro: false,
			paywallKind: "payment_failed",
			ctaUrl: pastDue.manage_url || CREWCALL_MANAGE_URL,
			manageUrl: pastDue.manage_url || CREWCALL_MANAGE_URL,
		};
	}

	const canceledOrExpired =
		rows.find((m) => m.status === "canceled" || m.status === "expired") ??
		rows.find((m) => ACCESS_GRANTING.has(m.status) && !isPeriodStillValid(m)) ??
		null;

	if (canceledOrExpired) {
		return freeAccess(
			userId,
			canceledOrExpired.status === "canceled" ? "canceled" : "trial_ended",
		);
	}

	return freeAccess(userId, "new");
}
