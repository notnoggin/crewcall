export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	return (
		<main className="min-h-screen px-5 py-16">
			<div className="mx-auto max-w-xl rounded-3xl border border-gray-a5 bg-gray-a2 p-8 text-center">
				<p className="text-2 font-semibold uppercase tracking-[0.2em] text-gray-9">
					Crewcall
				</p>
				<h1 className="mt-3 text-7 font-bold text-gray-12">
					Open Crewcall from your company dashboard
				</h1>
				<p className="mt-3 text-4 text-gray-10">
					Crewcall is a creator-facing hiring tool, so its active view lives
					in the Whop dashboard rather than a member experience.
				</p>
				<p className="mt-4 text-2 text-gray-9">
					Experience reference: {experienceId}
				</p>
			</div>
		</main>
	);
}
