import { headers } from "next/headers";
import { getWhopSdk } from "@/lib/whop-sdk";

export const CREWCALL_COMPANY_ID = "biz_zXEK1Sf9BNppBy";
export const CREWCALL_PRO_PRODUCT_ID = "prod_2i0TRvygPsApM";
export const CREWCALL_PRO_URL = "https://whop.com/crewcall/crewcall-pro/";
export const CREWCALL_MANAGE_URL = "https://whop.com/@me/settings/memberships";
/** New monthly plan with 3-day trial (old plan_ecX3Szio5Pj63 is archived). */
export const CREWCALL_MONTHLY_PLAN_ID = "plan_hqMX3rPUdXZ4K";
export const CREWCALL_ANNUAL_PLAN_ID = "plan_7omVbkAtzy7J0";

/** Always-on founder access for demos (your Whop user). */
const FOUNDER_USER_IDS = new Set(["user_SX0PVtcb4LM15"]);

const CREWCALL_ACCESS_GATING_ENABLED = true;

/**
 * Paywall states (Discord / Notion-style):
 *   new            → never subscribed → Start trial / Subscribe
 *   trial_ended    → trial over, no successful paid charge → Resubscribe
 *   canceled       → canceled or expired after access → Resubscribe (welcome back)
 *   payment_failed → past_due after a real paid period → Fix card (primary) + Resubscribe
 */
export type PaywallKind = "new" | "trial_ended" | "canceled" | "payment_failed";

export type AccessResult = {
	userId: string;
	hasAccess: boolean;
	paywallKind: PaywallKind;
	/** Primary CTA URL (subscribe or manage billing). */
	ctaUrl: string;
	/** Optional secondary link (e.g. manage memberships). */
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

function membershipProductId(m: MembershipRow): string | null {
	return m.product?.id ?? m.product_id ?? null;
}

type PaymentListRow = {
	status?: string;
	membership_id?: string;
	total?: { amount?: string };
	usd_total?: { amount?: string };
};

async function listPaymentsForMembership(membershipId: string): Promise<PaymentListRow[]> {
	const apiKey = process.env.WHOP_API_KEY;
	if (!apiKey) return [];

	const url = new URL("https://api.whop.com/api/v1/payments");
	url.searchParams.set("membership_id", membershipId);
	url.searchParams.set("first", "20");

	const res = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`payments list ${res.status}: ${body.slice(0, 200)}`);
	}

	const json = (await res.json()) as { data?: PaymentListRow[] };
	return json.data ?? [];
}

async function hadSuccessfulPaidCharge(membershipId: string): Promise<boolean> {
	try {
		const payments = await listPaymentsForMembership(membershipId);
		return payments.some((p) => {
			if (p.status !== "paid") return false;
			const amount = Number(p.total?.amount ?? p.usd_total?.amount ?? "0");
			return Number.isFinite(amount) && amount > 0;
		});
	} catch (error) {
		console.error("Crewcall: payment history lookup failed", membershipId, error);
		return false;
	}
}

/**
 * Access policy (real SaaS):
 *
 * Grant when membership is active | trialing | canceling AND period not ended.
 * Also grant free / any plan on the Crewcall Pro product (not only monthly/annual IDs).
 *
 * Deny + paywall:
 *   past_due           → payment_failed (fix card)
 *   canceled + ended   → canceled (resubscribe)
 *   expired / trial end→ trial_ended or canceled based on payment history
 *   no membership      → new (start trial)
 */
export async function hasCrewcallAccess(): Promise<AccessResult> {
	const sdk = getWhopSdk();
	const { userId } = await sdk.verifyUserToken(await headers());

	if (FOUNDER_USER_IDS.has(userId)) {
		return {
			userId,
			hasAccess: true,
			paywallKind: "new",
			ctaUrl: CREWCALL_PRO_URL,
			manageUrl: CREWCALL_MANAGE_URL,
		};
	}

	if (!CREWCALL_ACCESS_GATING_ENABLED) {
		return {
			userId,
			hasAccess: true,
			paywallKind: "new",
			ctaUrl: CREWCALL_PRO_URL,
			manageUrl: CREWCALL_MANAGE_URL,
		};
	}

	// List all company memberships for this user (includes free plans),
	// not only monthly/annual plan IDs.
	const memberships = await sdk.memberships.list({
		company_id: CREWCALL_COMPANY_ID,
		user_ids: [userId],
		first: 20,
	});

	const rows = (memberships.data as MembershipRow[]) ?? [];
	const ACCESS_GRANTING = new Set(["active", "trialing", "canceling", "completed"]);

	const valid = rows.find((m) => ACCESS_GRANTING.has(m.status) && isPeriodStillValid(m));
	if (valid) {
		return {
			userId,
			hasAccess: true,
			paywallKind: "new",
			ctaUrl: CREWCALL_PRO_URL,
			manageUrl: valid.manage_url || CREWCALL_MANAGE_URL,
		};
	}

	// past_due = payment failed while subscription still “alive”
	const pastDue = rows.find((m) => m.status === "past_due");
	if (pastDue) {
		return {
			userId,
			hasAccess: false,
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
		const paidBefore = await hadSuccessfulPaidCharge(canceledOrExpired.id);
		const kind: PaywallKind =
			canceledOrExpired.status === "canceled" || paidBefore ? "canceled" : "trial_ended";

		// Always send them to subscribe / product page — not “fix payment” for a dead membership.
		return {
			userId,
			hasAccess: false,
			paywallKind: kind,
			ctaUrl: CREWCALL_PRO_URL,
			manageUrl: CREWCALL_MANAGE_URL,
		};
	}

	return {
		userId,
		hasAccess: false,
		paywallKind: "new",
		ctaUrl: CREWCALL_PRO_URL,
		manageUrl: CREWCALL_MANAGE_URL,
	};
}
