import { NextResponse } from "next/server";
import {
	CREWCALL_COMPANY_ID,
	CREWCALL_MONTHLY_PLAN_ID,
	CREWCALL_ANNUAL_PLAN_ID,
	CREWCALL_MANAGE_URL,
} from "@/lib/crewcall-access";
import { getWhopSdk } from "@/lib/whop-sdk";

/**
 * Daily job: DM members whose trial or paid period ends in ~24 hours.
 *
 * Secure with CRON_SECRET:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Requires Whop app permissions:
 *   - dms:channel:manage
 *   - dms:message:manage
 *   - dms:read
 *   - membership:read (already needed for gating)
 */
export async function GET(request: Request) {
	const auth = request.headers.get("authorization");
	const secret = process.env.CRON_SECRET;
	if (!secret || auth !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sdk = getWhopSdk();
	const now = Date.now();
	const windowStart = now + 20 * 60 * 60 * 1000; // 20h from now
	const windowEnd = now + 28 * 60 * 60 * 1000; // 28h from now

	let reminded = 0;
	let skipped = 0;
	const errors: string[] = [];

	try {
		const memberships = await sdk.memberships.list({
			company_id: CREWCALL_COMPANY_ID,
			plan_ids: [CREWCALL_MONTHLY_PLAN_ID, CREWCALL_ANNUAL_PLAN_ID],
			first: 100,
		});

		for (const m of memberships.data) {
			const status = m.status;
			if (!["trialing", "active", "canceling"].includes(status)) {
				skipped += 1;
				continue;
			}

			const endRaw =
				(m as { renewal_period_end?: string | null }).renewal_period_end ??
				(m as { current_period_end?: string | null }).current_period_end ??
				null;
			if (!endRaw) {
				skipped += 1;
				continue;
			}

			const endMs = Date.parse(endRaw);
			if (!Number.isFinite(endMs) || endMs < windowStart || endMs > windowEnd) {
				skipped += 1;
				continue;
			}

			const userId =
				(m as { user?: { id?: string } }).user?.id ??
				(m as { user_id?: string }).user_id ??
				null;
			if (!userId) {
				skipped += 1;
				continue;
			}

			const isTrial = status === "trialing";
			const content = isTrial
				? [
						"**Your Crewcall Pro trial ends tomorrow.**",
						"",
						"After that, your card will be charged so you keep access to roles, applicants, and your bench.",
						"",
						`Manage or cancel anytime: ${CREWCALL_MANAGE_URL}`,
				  ].join("\n")
				: [
						"**Your Crewcall Pro plan renews tomorrow.**",
						"",
						"Make sure your payment method is up to date so access isn&apos;t interrupted.",
						"",
						`Update payment or cancel: ${CREWCALL_MANAGE_URL}`,
				  ].join("\n");

			try {
				const channel = await sdk.dmChannels.create({
					with_user_ids: [userId],
				});

				await sdk.messages.create({
					channel_id: channel.id,
					content,
				});

				reminded += 1;
			} catch (sendError) {
				const msg = sendError instanceof Error ? sendError.message : String(sendError);
				errors.push(`${userId}: ${msg}`);
				console.error("Crewcall billing reminder DM failed", userId, sendError);
			}
		}
	} catch (error) {
		console.error("Crewcall billing reminders cron failed:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Cron failed",
			},
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, reminded, skipped, errors });
}
