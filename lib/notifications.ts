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
	if (applicantWhopId && companyId) {
		try {
			const whopsdk = getWhopSdk();
			const channel = await whopsdk.supportChannels.create({ company_id: companyId, user_id: applicantWhopId });
			await whopsdk.messages.create({ channel_id: channel.id, content });
			return { delivered: true, channel: "whop_dm" as const };
		} catch (error) {
			console.error("[APPLICANT WHOP DM FAILED]", error);
		}
	}

	const resendKey = process.env.RESEND_API_KEY;
	const from = process.env.NOTIFICATION_FROM_EMAIL;
	if (!resendKey || !from) {
		console.error("[APPLICANT EMAIL FALLBACK UNCONFIGURED]", { applicantEmail, statusLabel, reason: "Set RESEND_API_KEY and NOTIFICATION_FROM_EMAIL." });
		return { delivered: false, channel: "email_fallback" as const };
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
	return { delivered: true, channel: "email_fallback" as const };
}
