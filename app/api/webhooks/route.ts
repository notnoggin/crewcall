import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { getWhopSdk } from "@/lib/whop-sdk";

export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const whopsdk = getWhopSdk();
	const requestBodyText = await request.text();
	const headers = Object.fromEntries(request.headers);
	const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });

	const event = webhookData as unknown as { type: string; data: unknown };

	if (event.type === "payment.succeeded") {
		waitUntil(handlePaymentSucceeded(event.data as Payment));
	}

	// Intentionally do NOT create a workspace on install.
	// A workspace is only created when the user completes onboarding
	// (POST /api/workspaces/onboard). Auto-creating on install caused
	// new installs to skip onboarding and land straight on the paywall.
	if (["app.installed", "app_installation.created", "installation.created"].includes(event.type)) {
		console.info("[INSTALLATION]", event.type, event.data);
	}

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}

async function handlePaymentSucceeded(payment: Payment) {
	console.log("[PAYMENT SUCCEEDED]", payment);
}
