import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ApplicationQuestion } from "@/lib/hiring";

export default async function PublicApplicationPage({
	params,
}: {
	params: Promise<{ role_id: string }>;
}) {
	const { role_id: roleId } = await params;
	const supabase = getSupabaseAdmin();
	const { data: role } = await supabase
		.from("roles")
		.select("id, title, type, description, status, application_templates(questions)")
		.eq("id", roleId)
		.maybeSingle();

	if (!role || role.status !== "open") notFound();

	const template = Array.isArray(role.application_templates)
		? role.application_templates[0]
		: role.application_templates;
	const questions = (template?.questions || []) as ApplicationQuestion[];

	return (
		<main className="min-h-screen px-5 py-16">
			<div className="mx-auto max-w-2xl">
				<div className="mb-8">
					<p className="mb-3 text-2 font-semibold uppercase tracking-[0.2em] text-gray-9">Crewcall application</p>
					<h1 className="text-9 font-bold text-gray-12">{role.title}</h1>
					<p className="mt-3 whitespace-pre-wrap text-4 text-gray-10">{role.description}</p>
				</div>
				<div className="rounded-3xl border border-gray-a5 bg-gray-a2 p-6 sm:p-8">
					<ApplicationForm roleId={role.id} questions={questions} />
				</div>
			</div>
		</main>
	);
}
