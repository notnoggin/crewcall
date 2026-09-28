import { getWhopSdk } from "@/lib/whop-sdk";

export async function notifyApplicant({
	companyId,
	applicantWhopId,
	message,
}: {
	companyId: string;
	applicantWhopId: string | null;
	message: string;
}) {
	if (!applicantWhopId) return { delivered: false, channel: "email_fallback" as const };

	const whopsdk = getWhopSdk();
	const channel = await whopsdk.supportChannels.create({
		company_id: companyId,
		user_id: applicantWhopId,
	});
	await whopsdk.messages.create({
		channel_id: channel.id,
		content: message,
	});
	return { delivered: true, channel: "whop_dm" as const };
}
