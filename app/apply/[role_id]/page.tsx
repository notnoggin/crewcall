import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ApplicationForm } from "@/components/application-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ApplicationQuestion } from "@/lib/hiring";
import { supportEmail } from "@/lib/support";

function publicOrigin() {
	return (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, "");
}

export async function generateMetadata({ params }: { params: Promise<{ role_id: string }> }): Promise<Metadata> {
	const { role_id: roleId } = await params;
	const { data: role } = await getSupabaseAdmin().from("roles").select("id, title, description, workspaces(name)").eq("id", roleId).maybeSingle();
	if (!role) return { title: "Crewcall bench" };
	const description = role.description || `Apply to the Crewcall bench for ${role.title}.`;
	const workspace = Array.isArray(role.workspaces) ? role.workspaces[0] : role.workspaces;
	const caption = workspace?.name ? `Apply to ${workspace.name}'s bench for ${role.title}.` : `Apply for ${role.title}.`;
	return {
		title: `${role.title} | Crewcall bench`,
		description: caption,
		openGraph: { title: role.title, description: caption, type: "website", images: [{ url: `${publicOrigin()}/api/banner/${roleId}`, width: 1200, height: 630, alt: `${role.title} bench` }] },
		twitter: { card: "summary_large_image", title: role.title, description: caption, images: [`${publicOrigin()}/api/banner/${roleId}`] },
	};
}

export default async function PublicApplicationPage({
	params,
}: {
	params: Promise<{ role_id: string }>;
}) {
	const { role_id: roleId } = await params;
	const supabase = getSupabaseAdmin();
	let { data: role, error: roleError } = await supabase
		.from("roles")
		.select("id, title, type, description, status, intake_mode, seat_cap, creator_name, platforms, pay_model, rate_offered, rate_currency, active_fields, rules, example_clip_links, geo, niche, languages, start_date, deadline, source_footage_url, application_templates(questions), applications(status), workspaces(name)")
		.eq("id", roleId)
		.maybeSingle();
	if (roleError && /active_fields/i.test(roleError.message)) {
		const retry = await supabase.from("roles").select("id, title, type, description, status, intake_mode, seat_cap, creator_name, platforms, pay_model, rate_offered, rules, example_clip_links, geo, niche, languages, start_date, deadline, source_footage_url, application_templates(questions), applications(status), workspaces(name)").eq("id", roleId).maybeSingle();
		role = retry.data ? { ...retry.data, rate_currency: null, active_fields: null } : null;
		roleError = retry.error;
	}

	if (!role) notFound();
	const approvedCount = Array.isArray(role.applications) ? role.applications.filter((application) => ["bench", "active", "paused"].includes(application.status)).length : 0;
	const seatsRemaining = role.intake_mode === "limited_seats" && role.seat_cap ? Math.max(role.seat_cap - approvedCount, 0) : null;
	const isClosed = role.status !== "open" || seatsRemaining === 0;

	const template = Array.isArray(role.application_templates)
		? role.application_templates[0]
		: role.application_templates;
	const questions = (template?.questions || []) as ApplicationQuestion[];
	const activeFields = Array.isArray(role.active_fields) ? role.active_fields : [];
	const workspace = Array.isArray(role.workspaces) ? role.workspaces[0] : role.workspaces;

	return (
		<main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
			<div className="mx-auto max-w-3xl">
				<div className="mb-10 flex items-center justify-between"><div className="crewcall-logo-chip"><img src="/crewcall-logo-modified.png" alt="Crewcall" className="h-full w-full object-contain" /></div><ThemeToggle /></div>
				<div className="mb-8">
					<p className="page-kicker">Apply to bench</p>
					<h1 className="page-title max-w-2xl">{role.title}</h1>
					{role.creator_name && <p className="mt-3 text-4 text-gray-10">{role.creator_name}{role.niche ? ` · ${role.niche}` : ""}</p>}
					<p className="page-subtitle whitespace-pre-wrap">{role.description}</p>
					<div className="mt-5 grid gap-2 rounded-2xl border border-gray-a5 bg-gray-a2 p-4 text-3 text-gray-10">
						{(!activeFields.length || activeFields.includes("platforms")) && role.type === "clipper" && role.platforms?.length > 0 && <p><strong className="text-gray-12">Platforms:</strong> {role.platforms.join(", ")}</p>}
						{(!activeFields.length || activeFields.includes("pay")) && role.pay_model && <p><strong className="text-gray-12">Pay:</strong> {role.pay_model} {role.rate_offered !== null ? `· ${role.rate_currency === "EUR" ? "€" : role.rate_currency === "GBP" ? "£" : role.rate_currency === "NGN" ? "₦" : "$"}${role.rate_offered}` : ""}</p>}
						{(!activeFields.length || activeFields.includes("rules")) && role.rules && <p><strong className="text-gray-12">Rules:</strong> {role.rules}</p>}
						{(!activeFields.length || activeFields.includes("examples")) && role.example_clip_links?.length > 0 && <p><strong className="text-gray-12">Examples:</strong> {role.example_clip_links.map((link: string) => <a key={link} href={link} target="_blank" rel="noreferrer" className="ml-2 text-accent-11">{link}</a>)}</p>}
						{(!activeFields.length || activeFields.includes("sourceFootage")) && (role.source_footage_url ? <p><strong className="text-gray-12">Source footage:</strong> <a href={role.source_footage_url} target="_blank" rel="noreferrer" className="text-accent-11">{role.source_footage_url}</a></p> : <p><strong className="text-gray-12">Brief:</strong> Provided after review.</p>)}
						{(!activeFields.length || activeFields.includes("dates")) && (role.start_date || role.deadline) && <p><strong className="text-gray-12">Dates:</strong> {role.start_date || "TBD"} — {role.deadline || "TBD"}</p>}
						{seatsRemaining !== null && <p><strong className="text-gray-12">Seats remaining:</strong> {seatsRemaining}</p>}
					</div>
				</div>
				<div className="premium-surface p-6 sm:p-8">
					{isClosed ? <div className="rounded-2xl border border-gray-a5 bg-gray-a3 p-6 text-center"><h2 className="text-6 font-bold text-gray-12">Applications closed</h2><p className="mt-2 text-4 text-gray-10">This bench is not accepting new applicants.</p></div> : <ApplicationForm roleId={role.id} roleType={role.type} questions={questions} activeFields={activeFields} />}
				</div>
				<p className="mt-6 text-center text-3 text-gray-9">Powered by Crewcall · <a href={`mailto:${supportEmail}`} className="text-accent-11">Contact support</a></p>
			</div>
		</main>
	);
}
