import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { answerLabel } from "@/lib/application-fields";
import { supportEmail } from "@/lib/support";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
	applied: "Application received",
	needs_info: "More information needed",
	sample_requested: "More samples requested",
	test_sent: "Test sent",
	test_submitted: "Test submitted",
	bench: "Added to the hiring bench",
	rejected: "Not moving forward",
	dismissed: "Application closed",
};

export default async function ApplicantStatusPage({ params, searchParams }: { params: Promise<{ role_id: string; application_id: string }>; searchParams: Promise<{ token?: string }> }) {
	const { role_id: roleId, application_id: applicationId } = await params;
	const { token } = await searchParams;
	if (token) redirect(`/a/${applicationId}?k=${token}`);
	redirect(`/a/${applicationId}`);
}
