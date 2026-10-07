import { headers } from "next/headers";
import { getWhopSdk } from "@/lib/whop-sdk";

export const CREWCALL_COMPANY_ID = "biz_zXEK1Sf9BNppBy";
export const CREWCALL_PRO_PRODUCT_ID = "prod_2i0TRvygPsApM";
export const CREWCALL_PRO_URL = "https://whop.com/crewcall/crewcall-pro/";
export const CREWCALL_MANAGE_URL = "https://whop.com/@me/settings/memberships";
export const CREWCALL_MONTHLY_PLAN_ID = "plan_ecX3Szio5Pj63";
export const CREWCALL_ANNUAL_PLAN_ID = "plan_7omVbkAtzy7J0";
const CREWCALL_ACCESS_GATING_ENABLED = true;

export type PaywallKind = "new" | "trial_ended" | "payment_failed";

export type AccessResult = {
	userId: string;
	hasAccess: boolean;
	/** Only meaningful when hasAccess is false. */
	paywallKind: PaywallKind;
	manageUrl: string;
};

type MembershipRow = {
	id: string;
	status: string;
	renewal_period_end?: string | null;
	current_period_end?: string | null;
	manage_url?: string | null;
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

/**
 * Distinguish trial-ended (never successfully paid) vs payment-failed
 * (had at least one paid charge that later failed to renew).
 */
async function resolveLapsedKind(
	sdk: ReturnType<typeof getWhopSdk>,
	membershipId: string,
): Promise<Exclude<PaywallKind, "new">> {
	try {
		const payments = await sdk.payments.list({
			membership_id: membershipId,
			first: 20,
		});

		const hasSuccessfulPaidCharge = payments.data.some((p) => {
			if (p.status !== "paid") return false;
			const amount = Number(
				(p as { total?: { amount?: string } }).total?.amount ??
					(p as { usd_total?: { amount?: string } }).usd_total?.amount ??
					"0",
			);
			return Number.isFinite(amount) && amount > 0;
		});

		return hasSuccessfulPaidCharge ? "payment_failed" : "trial_ended";
	} catch (error) {
		console.error("Crewcall: could not classify lapsed membership", membershipId, error);
		// Safer default for a failed renewal after trial.
		return "trial_ended";
	}
}

/**
 * Access policy:
 *   trialing / active / canceling (period not ended) → access
 *   past_due / canceled / expired / period over       → paywall
 *
 * Paywall kinds:
 *   new            → never subscribed (onboarding conversion)
 *   trial_ended    → trial finished, first charge failed or never paid
 *   payment_failed → had a real paid plan, renewal failed
 */
export async function hasCrewcallAccess(): Promise<AccessResult> {
	const sdk = getWhopSdk();
	const { userId } = await sdk.verifyUserToken(await headers());

	if (!CREWCALL_ACCESS_GATING_ENABLED) {
		return { userId, hasAccess: true, paywallKind: "new", manageUrl: CREWCALL_MANAGE_URL };
	}

	const memberships = await sdk.memberships.list({
		company_id: CREWCALL_COMPANY_ID,
		user_ids: [userId],
		plan_ids: [CREWCALL_MONTHLY_PLAN_ID, CREWCALL_ANNUAL_PLAN_ID],
		first: 10,
	});

	const rows = memberships.data as MembershipRow[];
	const ACCESS_GRANTING = new Set(["active", "trialing", "canceling"]);

	const valid = rows.find((m) => ACCESS_GRANTING.has(m.status) && isPeriodStillValid(m));
	if (valid) {
		return {
			userId,
			hasAccess: true,
			paywallKind: "new",
			manageUrl: valid.manage_url || CREWCALL_MANAGE_URL,
		};
	}

	// Prefer a membership that clearly lapsed (past_due / expired / canceled).
	const lapsed =
		rows.find((m) => ["past_due", "expired", "canceled"].includes(m.status)) ??
		rows.find((m) => ACCESS_GRANTING.has(m.status) && !isPeriodStillValid(m)) ??
		null;

	if (lapsed) {
		const kind = await resolveLapsedKind(sdk, lapsed.id);
		return {
			userId,
			hasAccess: false,
			paywallKind: kind,
			manageUrl: lapsed.manage_url || CREWCALL_MANAGE_URL,
		};
	}

	// No membership on our plans → first-time conversion paywall.
	return {
		userId,
		hasAccess: false,
		paywallKind: "new",
		manageUrl: CREWCALL_PRO_URL,
	};
}
