import { getWhopSdk } from "@/lib/whop-sdk";

export async function notifyApplicant({
	companyId,
	applicantWhopId,
	applicantEmail,
	roleTitle,
	statusLabel,
	statusUrl,
	note,
	message,
}: {
	companyId: string;
	applicantWhopId: string | null;
	applicantEmail: string;
	roleTitle: string;
	statusLabel: string;
	statusUrl: string;
	note?: string | null;
	message: string;
}) {
	const content = [`Crewcall application update`, `Role: ${roleTitle}`, `Status: ${statusLabel}`, message, note?.trim() ? `Reviewer note: ${note.trim()}` : null, `View status: ${statusUrl}`].filter(Boolean).join("\n\n");
	console.info("[APPLICANT NOTIFICATION PATH]", {
		applicantWhopId: applicantWhopId || null,
		whopIdFound: Boolean(applicantWhopId),
		dmAttempted: false,
		emailAttempted: true,
		statusLabel,
	});
	let dmResult: "success" | "error" | "no_whop_account_found" = "no_whop_account_found";
	if (applicantWhopId && companyId) {
		try {
			const whopsdk = getWhopSdk();
			console.info("[APPLICANT WHOP DM CALL]", { applicantWhopId, companyId, statusLabel });
			const channel = await whopsdk.supportChannels.create({ company_id: companyId, user_id: applicantWhopId });
			await whopsdk.messages.create({ channel_id: channel.id, content });
			dmResult = "success";
			console.info("[APPLICANT WHOP DM RESULT]", { applicantWhopId, result: dmResult, statusLabel });
		} catch (error) {
			dmResult = "error";
			console.error("[APPLICANT WHOP DM RESULT]", { applicantWhopId, result: dmResult, statusLabel, error: error instanceof Error ? error.message : "Unknown error" });
		}
	} else {
		console.info("[APPLICANT WHOP DM RESULT]", { applicantWhopId: applicantWhopId || null, result: dmResult, statusLabel });
	}

	console.info("[APPLICANT EMAIL SEND]", { applicantEmail, statusLabel, reason: dmResult === "success" ? "whop_dm_plus_email" : dmResult });
	const resendKey = process.env.RESEND_API_KEY;
	const from = process.env.NOTIFICATION_FROM_EMAIL;
	if (!resendKey || !from) {
		console.error("[APPLICANT EMAIL FALLBACK UNCONFIGURED]", { applicantEmail, statusLabel, reason: "Set RESEND_API_KEY and NOTIFICATION_FROM_EMAIL." });
		return { delivered: false, channel: dmResult === "success" ? "whop_dm_plus_email" as const : "email" as const, dmResult };
	}
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
		body: JSON.stringify({ from, to: [applicantEmail], subject: `${roleTitle}: ${statusLabel}`, text: content }),
	});
	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`Applicant email fallback failed with ${response.status}: ${detail.slice(0, 300)}`);
	}
	console.info("[APPLICANT EMAIL RESULT]", { applicantEmail, statusLabel, result: "success" });
	return { delivered: true, channel: dmResult === "success" ? "whop_dm_plus_email" as const : "email" as const, dmResult };
}
