import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ApplicationForm } from "@/components/application-form";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ApplicationQuestion } from "@/lib/hiring";

function publicOrigin() {
	return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: Promise<{ role_id: string }> }): Promise<Metadata> {
	const { role_id: roleId } = await params;
	const { data: role } = await getSupabaseAdmin().from("roles").select("id, title, description").eq("id", roleId).maybeSingle();
	if (!role) return { title: "Crewcall roster" };
	const description = role.description || `Apply to the Crewcall roster for ${role.title}.`;
	return {
		title: `${role.title} | Crewcall roster`,
		description,
		openGraph: { title: role.title, description, type: "website", images: [{ url: `${publicOrigin()}/api/banner/${role.id}`, width: 1200, height: 630, alt: `${role.title} Crewcall roster` }] },
		twitter: { card: "summary_large_image", title: role.title, description, images: [`${publicOrigin()}/api/banner/${role.id}`] },
	};
}

export default async function PublicApplicationPage({
	params,
}: {
	params: Promise<{ role_id: string }>;
}) {
	const { role_id: roleId } = await params;
	const supabase = getSupabaseAdmin();
	const { data: role } = await supabase
		.from("roles")
		.select("id, title, type, description, status, intake_mode, seat_cap, creator_name, platforms, pay_model, rate_offered, rules, example_clip_links, geo, niche, languages, start_date, deadline, source_footage_url, application_templates(questions), applications(status)")
		.eq("id", roleId)
		.maybeSingle();

	if (!role) notFound();
	const approvedCount = Array.isArray(role.applications) ? role.applications.filter((application) => ["bench", "active", "paused"].includes(application.status)).length : 0;
	const seatsRemaining = role.intake_mode === "limited_seats" && role.seat_cap ? Math.max(role.seat_cap - approvedCount, 0) : null;
	const isClosed = role.status !== "open" || seatsRemaining === 0;

	const template = Array.isArray(role.application_templates)
		? role.application_templates[0]
		: role.application_templates;
	const questions = (template?.questions || []) as ApplicationQuestion[];

	return (
		<main className="min-h-screen px-5 py-16">
			<div className="mx-auto max-w-2xl">
				<div className="mb-8">
					<p className="mb-3 text-2 font-semibold uppercase tracking-[0.2em] text-gray-9">Apply to roster</p>
					<h1 className="text-9 font-bold text-gray-12">{role.title}</h1>
					{role.creator_name && <p className="mt-2 text-4 text-gray-10">{role.creator_name}{role.niche ? ` · ${role.niche}` : ""}</p>}
					<p className="mt-3 whitespace-pre-wrap text-4 text-gray-10">{role.description}</p>
					<div className="mt-5 grid gap-2 rounded-2xl border border-gray-a5 bg-gray-a2 p-4 text-3 text-gray-10">
						{role.platforms?.length > 0 && <p><strong className="text-gray-12">Platforms:</strong> {role.platforms.join(", ")}</p>}
						{role.pay_model && <p><strong className="text-gray-12">Pay:</strong> {role.pay_model} {role.rate_offered !== null ? `· ${role.rate_offered}` : ""}</p>}
						{role.rules && <p><strong className="text-gray-12">Rules:</strong> {role.rules}</p>}
						{role.example_clip_links?.length > 0 && <p><strong className="text-gray-12">Examples:</strong> {role.example_clip_links.map((link: string) => <a key={link} href={link} target="_blank" rel="noreferrer" className="ml-2 text-accent-11 underline">{link}</a>)}</p>}
						{role.source_footage_url ? <p><strong className="text-gray-12">Source footage:</strong> <a href={role.source_footage_url} target="_blank" rel="noreferrer" className="text-accent-11 underline">{role.source_footage_url}</a></p> : <p><strong className="text-gray-12">Brief:</strong> Provided after review.</p>}
						{(role.start_date || role.deadline) && <p><strong className="text-gray-12">Dates:</strong> {role.start_date || "TBD"} — {role.deadline || "TBD"}</p>}
						{seatsRemaining !== null && <p><strong className="text-gray-12">Seats remaining:</strong> {seatsRemaining}</p>}
					</div>
				</div>
				<div className="rounded-3xl border border-gray-a5 bg-gray-a2 p-6 sm:p-8">
					{isClosed ? <div className="rounded-2xl border border-gray-a5 bg-gray-a3 p-6 text-center"><h2 className="text-6 font-bold text-gray-12">Applications closed</h2><p className="mt-2 text-4 text-gray-10">This roster is not accepting new applicants.</p></div> : <ApplicationForm roleId={role.id} roleType={role.type} questions={questions} />}
				</div>
			</div>
		</main>
	);
}
