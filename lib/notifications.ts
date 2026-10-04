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

export async function notifyApplicant({
	applicantWhopId,
	applicantEmail,
	roleTitle,
	statusLabel,
	statusUrl,
	note,
	message,
}: ApplicantNotificationInput) {
	const content = [
		"Crewcall application update",
		`Role: ${roleTitle}`,
		`Status: ${statusLabel}`,
		message,
		note?.trim() ? `Reviewer note: ${note.trim()}` : null,
		`View status: ${statusUrl}`,
	].filter(Boolean).join("\n\n");
	const recipient = applicantWhopId || applicantEmail.trim().toLowerCase();
	let dmResult: "success" | "error" | "no_whop_account_found" = "no_whop_account_found";

	console.info("[APPLICANT WHOP DM PATH]", {
		applicantWhopId: applicantWhopId || null,
		whopIdFound: Boolean(applicantWhopId),
		recipientType: applicantWhopId ? "user_id" : "email",
		statusLabel,
	});

	if (recipient) {
		try {
			console.info("[APPLICANT WHOP DM CALL]", {
				applicantWhopId: applicantWhopId || null,
				recipientType: applicantWhopId ? "user_id" : "email",
				statusLabel,
			});
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
			console.info("[APPLICANT WHOP DM RESULT]", {
				applicantWhopId: applicantWhopId || null,
				recipientType: applicantWhopId ? "user_id" : "email",
				result: dmResult,
				statusLabel,
			});
		} catch (error) {
			dmResult = "error";
			console.error("[APPLICANT WHOP DM RESULT]", {
				applicantWhopId: applicantWhopId || null,
				recipientType: applicantWhopId ? "user_id" : "email",
				result: dmResult,
				statusLabel,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	return { delivered: dmResult === "success", channel: "whop_dm" as const, dmResult };
}

export async function notifyWorkspaceAdminsDm({ companyId, roleTitle, applicantEmail, statusUrl }: { companyId: string; roleTitle: string; applicantEmail: string; statusUrl: string }) {
	// Agency staff/owners are "authorized users" of a company, not "members" (members.list returns
// customers of the company, which is the wrong population for "who runs this agency").
const authorizedUsers = await getWhopSdk().authorizedUsers.list({ company_id: companyId, first: 100 });
const recipients = [...new Set(authorizedUsers.data.map((entry) => entry.user?.id).filter((id): id is string => Boolean(id)))];
	if (!recipients.length) {
		console.error("[AGENCY WHOP DM NO_RECIPIENT]", { companyId, adminCount: admins.data.length });
		return { delivered: false, recipientCount: 0 };
	}
	let delivered = 0;
	for (const recipient of recipients) {
		try {
			const channelResponse = await fetch(`${process.env.WHOP_BASE_URL || "https://api.whop.com/api/v1"}/dm_channels`, {
				method: "POST",
				headers: {
                    Authorization: `Bearer ${process.env.WHOP_API_KEY || ""}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ with_user_ids: [recipient], notifications_enabled: true }),
			});
			if (!channelResponse.ok) {
				const detail = await channelResponse.text();
				throw new Error(`Whop DM channel creation failed with ${channelResponse.status}: ${detail.slice(0, 300)}`);
			}
			const channel = (await channelResponse.json()) as { id?: string };
			if (!channel.id) throw new Error("Whop DM channel response did not include a channel ID.");
			await getWhopSdk().messages.create({
				channel_id: channel.id,
				content: `New application for ${roleTitle}.\n\nApplicant email: ${applicantEmail}\n\nReview it in Crewcall:\n${statusUrl}`,
			});
			delivered += 1;
		} catch (error) {
			console.error("[AGENCY WHOP DM RESULT]", {
				companyId,
				recipient,
				result: "error",
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}
	console.info("[AGENCY WHOP DM RESULT]", { companyId, recipientCount: recipients.length, delivered });
	return { delivered: delivered > 0, recipientCount: recipients.length };
}
