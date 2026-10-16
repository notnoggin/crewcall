import { redirect } from "next/navigation";
import Link from "next/link";

async function resolveCompanyId(experienceId: string): Promise<string | null> {
	const key = process.env.WHOP_API_KEY;
	if (!key) return null;

	const headers = { Authorization: `Bearer ${key}` };

	try {
		const one = await fetch(`https://api.whop.com/api/v1/experiences/${experienceId}`, {
			headers,
			cache: "no-store",
		});
		if (one.ok) {
			const experience = (await one.json()) as {
				company?: { id?: string } | null;
				account?: { id?: string } | null;
			};
			const id = experience.company?.id || experience.account?.id;
			if (id) return id;
		}
	} catch {
		/* fall through */
	}

	const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
	if (!appId) return null;

	try {
		const list = await fetch(
			`https://api.whop.com/api/v1/experiences?app_id=${appId}&first=100`,
			{ headers, cache: "no-store" },
		);
		if (!list.ok) return null;
		const body = (await list.json()) as {
			data?: Array<{
				id?: string;
				company?: { id?: string } | null;
				account?: { id?: string } | null;
			}>;
		};
		const match = (body.data || []).find((item) => item.id === experienceId);
		return match?.company?.id || match?.account?.id || null;
	} catch {
		return null;
	}
}

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const companyId = await resolveCompanyId(experienceId);

	if (companyId) {
		redirect(`/dashboard/${companyId}`);
	}

	return (
		<main className="min-h-screen px-5 py-16">
			<div className="premium-surface mx-auto max-w-md p-8 text-center">
				<p className="page-kicker">Crewcall</p>
				<h1 className="page-title mt-3 text-4xl">Open your hiring desk</h1>
				<p className="page-subtitle mt-3">
					Crewcall lives in your company dashboard. Open it from Apps to
					start hiring.
				</p>
				<Link href="https://whop.com/dashboard" className="button-link mt-6 inline-flex">
					Go to dashboard
				</Link>
			</div>
		</main>
	);
}
