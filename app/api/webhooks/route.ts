import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
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
	if (["app.installed", "app_installation.created", "installation.created"].includes(event.type)) {
		waitUntil(handleInstallation(event.data));
	}

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}

async function handleInstallation(data: unknown) {
	if (!data || typeof data !== "object") return;
	const payload = data as Record<string, unknown>;
	const companyId =
		typeof payload.company_id === "string"
			? payload.company_id
			: typeof payload.companyId === "string"
				? payload.companyId
				: typeof payload.company === "object" &&
						payload.company &&
						"id" in payload.company &&
						typeof payload.company.id === "string"
					? payload.company.id
					: null;

	if (!companyId) return;
	const supabase = getSupabaseAdmin();
	const { error } = await supabase
		.from("workspaces")
		.upsert(
			{ whop_company_id: companyId, hiring_type: "custom" },
			{ onConflict: "whop_company_id", ignoreDuplicates: true },
		);
	if (error) console.error("[INSTALLATION WORKSPACE]", error);
}

async function handlePaymentSucceeded(payment: Payment) {
	// This is a placeholder for a potentially long running operation
	// In a real scenario, you might need to fetch user data, update a database, etc.
	console.log("[PAYMENT SUCCEEDED]", payment);
}
