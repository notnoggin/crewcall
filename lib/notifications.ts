import { getWhopSdk } from "@/lib/whop-sdk";

type ApplicantNotificationInput = {
	companyId: string;
	applicantWhopId: string | null;
	applicantEmail: string;
	roleTitle: string;
	statusLabel: string;
	statusUrl: string;
	note?: string | null;
	message: string;
};

async function sendEmail({ from, to, subject, text, resendKey }: { from: string; to: string[]; subject: string; text: string; resendKey: string }) {
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
		body: JSON.stringify({ from, to, subject, text }),
	});
	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`Email delivery failed with ${response.status}: ${detail.slice(0, 300)}`);
	}
	return response;
}

export async function notifyApplicant({
	companyId,
	applicantWhopId,
	applicantEmail,
	roleTitle,
	statusLabel,
	statusUrl,
	note,
	message,
}: ApplicantNotificationInput) {
	const content = [`Crewcall application update`, `Role: ${roleTitle}`, `Status: ${statusLabel}`, message, note?.trim() ? `Reviewer note: ${note.trim()}` : null, `View status: ${statusUrl}`].filter(Boolean).join("\n\n");
	const recipient = applicantWhopId || applicantEmail.trim().toLowerCase();
	let dmResult: "success" | "error" | "no_whop_account_found" = "no_whop_account_found";

	console.info("[APPLICANT NOTIFICATION PATH]", {
		applicantWhopId: applicantWhopId || null,
		whopIdFound: Boolean(applicantWhopId),
		recipientType: applicantWhopId ? "user_id" : "email",
		emailAttempted: true,
		statusLabel,
	});

	if (recipient) {
		try {
			console.info("[APPLICANT WHOP DM CALL]", { applicantWhopId: applicantWhopId || null, recipientType: applicantWhopId ? "user_id" : "email", statusLabel });
			const dmResponse = await fetch(`${process.env.WHOP_BASE_URL || "https://api.whop.com/api/v1"}/dm_channels`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.WHOP_API_KEY || ""}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ with_user_ids: [recipient], notifications_enabled: true }),
			});
			if (dmResponse.status === 404 || dmResponse.status === 422) {
				dmResult = "no_whop_account_found";
			} else if (!dmResponse.ok) {
				const detail = await dmResponse.text();
				throw new Error(`Whop DM channel creation failed with ${dmResponse.status}: ${detail.slice(0, 300)}`);
			} else {
				const channel = (await dmResponse.json()) as { id?: string };
				if (!channel.id) throw new Error("Whop DM channel response did not include a channel ID.");
				await getWhopSdk().messages.create({ channel_id: channel.id, content });
				dmResult = "success";
			}
			console.info("[APPLICANT WHOP DM RESULT]", { applicantWhopId: applicantWhopId || null, recipientType: applicantWhopId ? "user_id" : "email", result: dmResult, statusLabel });
		} catch (error) {
			dmResult = "error";
			console.error("[APPLICANT WHOP DM RESULT]", { applicantWhopId: applicantWhopId || null, recipientType: applicantWhopId ? "user_id" : "email", result: dmResult, statusLabel, error: error instanceof Error ? error.message : "Unknown error" });
		}
	}

	const resendKey = process.env.RESEND_API_KEY;
	const from = process.env.NOTIFICATION_FROM_EMAIL;
	console.info("[APPLICANT EMAIL SEND]", { applicantEmail, statusLabel, reason: dmResult === "success" ? "whop_dm_plus_email" : dmResult });
	if (!resendKey || !from) {
		console.error("[APPLICANT EMAIL UNCONFIGURED]", { applicantEmail, statusLabel, reason: "Set RESEND_API_KEY and NOTIFICATION_FROM_EMAIL." });
		return { delivered: false, channel: dmResult === "success" ? "whop_dm_plus_email" as const : "email" as const, dmResult };
	}
	await sendEmail({ from, to: [applicantEmail], subject: `${roleTitle}: ${statusLabel}`, text: content, resendKey });
	console.info("[APPLICANT EMAIL RESULT]", { applicantEmail, statusLabel, result: "success" });
	return { delivered: true, channel: dmResult === "success" ? "whop_dm_plus_email" as const : "email" as const, dmResult };
}

export async function notifyWorkspaceAdmins({ companyId, roleTitle, applicantEmail, statusUrl }: { companyId: string; roleTitle: string; applicantEmail: string; statusUrl: string }) {
	const resendKey = process.env.RESEND_API_KEY;
	const from = process.env.NOTIFICATION_FROM_EMAIL;
	if (!resendKey || !from) {
		console.error("[AGENCY APPLICATION ALERT UNCONFIGURED]", { companyId, reason: "Set RESEND_API_KEY and NOTIFICATION_FROM_EMAIL." });
		return { delivered: false, recipients: [] as string[] };
	}
	const admins = await getWhopSdk().members.list({ company_id: companyId, access_level: "admin", first: 100 });
	const recipients = [...new Set(admins.data.map((member) => member.user?.email?.trim().toLowerCase()).filter((email): email is string => Boolean(email)))];
	if (!recipients.length) {
		console.error("[AGENCY APPLICATION ALERT NO_RECIPIENT]", { companyId, adminCount: admins.data.length });
		return { delivered: false, recipients };
	}
	await sendEmail({
		from,
		to: recipients,
		subject: `New application for ${roleTitle}`,
		text: `A new application was submitted for ${roleTitle}.\n\nApplicant email: ${applicantEmail}\n\nReview it in Crewcall:\n${statusUrl}`,
		resendKey,
	});
	console.info("[AGENCY APPLICATION ALERT SENT]", { companyId, recipients, roleTitle });
	return { delivered: true, recipients };
}
