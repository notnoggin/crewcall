import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { supportEmail } from "@/lib/support";
import { ThemeToggle } from "@/components/theme-toggle";
import { CopyStatusLink } from "@/components/copy-status-link";

export const dynamic = "force-dynamic";

const actionLabels: Record<string, string> = {
	application_submitted: "Application received",
	request_sample: "More samples requested",
	needs_info: "More information needed",
	send_test: "Test sent",
	test_result: "Test result updated",
	hire: "Added to the hiring bench",
	reject: "Not moving forward",
	dismiss: "Application closed",
	review_saved: "Review updated",
};

function eventLabel(action: string) {
	return actionLabels[action] || action.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function ApplicationStatusPage({ params, searchParams }: { params: Promise<{ application_id: string }>; searchParams: Promise<{ k?: string }> }) {
	const { application_id: applicationId } = await params;
	const { k } = await searchParams;
	if (!k) notFound();
	const { data: application } = await getSupabaseAdmin()
		.from("applications")
		.select("status, status_token, roles!inner(id, title), application_events(action, note, created_at)")
		.eq("id", applicationId)
		.eq("status_token", k)
		.order("created_at", { foreignTable: "application_events", ascending: true })
		.maybeSingle();
	if (!application) notFound();
	const role = Array.isArray(application.roles) ? application.roles[0] : application.roles;
	const events = Array.isArray(application.application_events) ? application.application_events : [];
	const statusUrl = `/a/${applicationId}?k=${application.status_token}`;

	return <main className="min-h-screen px-5 py-16"><div className="mx-auto max-w-2xl"><div className="mb-6 flex justify-end"><ThemeToggle /></div><p className="mb-3 text-2 font-semibold uppercase tracking-[0.2em] text-gray-9">Application updates</p><h1 className="text-8 font-bold text-gray-12">{role.title}</h1><p className="mt-3 text-4 text-gray-10">This page is your permanent application link. Reload it to see the latest update from the hiring team.</p><section className="premium-surface mt-6 rounded-3xl p-6"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-5 font-semibold text-gray-12">Updates</h2><CopyStatusLink href={statusUrl} /></div>{events.length ? <div className="grid gap-5">{events.map((event) => <article key={`${event.created_at}-${event.action}`} className="relative border-l-2 border-accent-a6 pl-5"><span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-accent-9" /><p className="text-4 font-semibold text-gray-12">{eventLabel(event.action)}</p><time className="mt-1 block text-2 text-gray-9">{new Date(event.created_at).toLocaleString()}</time>{event.note?.trim() && <p className="mt-3 whitespace-pre-wrap text-3 text-gray-10">{event.note.trim()}</p>}</article>)}</div> : <p className="text-3 text-gray-10">No updates have been posted yet.</p>}</section><p className="mt-6 text-3 text-gray-10">Having an issue? <a href={`mailto:${supportEmail}`} className="text-accent-11">Contact support</a></p></div></main>;
}
