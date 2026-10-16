import { redirect } from "next/navigation";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	try {
		const response = await fetch(
			`https://api.whop.com/api/v1/experiences/${experienceId}`,
			{
				headers: {
					Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
				},
				cache: "no-store",
			},
		);

		if (response.ok) {
			const experience = (await response.json()) as {
				company?: { id?: string } | null;
				account?: { id?: string } | null;
			};
			const companyId = experience.company?.id || experience.account?.id;
			if (companyId) {
				redirect(`/dashboard/${companyId}`);
			}
		} else {
			console.error(
				"Experience lookup failed:",
				response.status,
				await response.text(),
			);
		}
	} catch (error) {
		console.error("Could not open Crewcall from experience:", error);
	}

	return (
		<main className="min-h-screen px-5 py-16">
			<div className="mx-auto max-w-xl rounded-3xl border border-gray-a5 bg-gray-a2 p-8 text-center">
				<p className="text-2 font-semibold uppercase tracking-[0.2em] text-gray-9">
					Crewcall
				</p>
				<h1 className="mt-3 text-7 font-bold text-gray-12">
					Could not open this workspace
				</h1>
				<p className="mt-3 text-4 text-gray-10">
					Open Crewcall from the company dashboard under Apps. The sidebar
					view needs the experience read permission on the new app.
				</p>
				<p className="mt-4 text-2 text-gray-9">
					Experience reference: {experienceId}
				</p>
			</div>
		</main>
	);
}
