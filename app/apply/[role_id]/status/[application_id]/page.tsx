import Link from "next/link";
import { notFound } from "next/navigation";
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
	if (!token) notFound();
	const { data: application } = await getSupabaseAdmin()
		.from("applications")
		.select("status, status_token, roles!inner(id, title), application_events(note, created_at)")
		.eq("id", applicationId)
		.eq("role_id", roleId)
		.eq("status_token", token)
		.order("created_at", { foreignTable: "application_events", ascending: false })
		.maybeSingle();
	if (!application) notFound();
	const role = Array.isArray(application.roles) ? application.roles[0] : application.roles;
	const events = Array.isArray(application.application_events) ? application.application_events : [];
	const latestNote = events.find((event) => event.note?.trim())?.note?.trim();
	return <main className="min-h-screen px-5 py-16"><div className="mx-auto max-w-2xl"><div className="mb-6 flex justify-end"><ThemeToggle /></div><p className="mb-3 text-2 font-semibold uppercase tracking-[0.2em] text-gray-9">Application status</p><h1 className="text-8 font-bold text-gray-12">{role.title}</h1><section className="premium-surface mt-6 grid gap-4 rounded-3xl p-6"><div><p className="text-3 text-gray-9">Current stage</p><p className="mt-1 text-6 font-semibold text-gray-12">{statusLabels[application.status] || answerLabel(application.status)}</p></div>{latestNote && <div><p className="text-3 text-gray-9">Latest note</p><p className="mt-1 whitespace-pre-wrap text-4 text-gray-11">{latestNote}</p></div>}</section><p className="mt-6 text-3 text-gray-10">Having an issue? <a href={`mailto:${supportEmail}`} className="text-accent-11">Contact support</a></p></div></main>;
}
