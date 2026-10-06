import Link from "next/link";
import { hasCrewcallAccess, CREWCALL_PRO_URL } from "@/lib/crewcall-access";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function DashboardLayout({
	children,
	params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ companyId: string }> }>) {
	try {
		const { companyId } = await params;

		// First visit for a company: no workspace yet → always show onboarding.
		// Membership is only required after the workspace has been created.
		const { data: workspace } = await getSupabaseAdmin()
			.from("workspaces")
			.select("id")
			.eq("whop_company_id", companyId)
			.maybeSingle();

		if (!workspace) {
			return children;
		}

		const { hasAccess } = await hasCrewcallAccess();

		if (!hasAccess) {
			return (
				<main className="min-h-screen px-5 py-16">
					<div className="mx-auto flex max-w-lg flex-col items-center text-center">
						{/* Logo chip */}
						<div className="crewcall-logo-chip mb-8">
							<img
								src="/crewcall-logo-modified.png"
								alt="Crewcall"
								className="h-full w-full object-contain"
							/>
						</div>

						<div className="w-full rounded-3xl border border-gray-a5 bg-gray-a2 p-8 sm:p-10">
							<p className="text-3 font-semibold uppercase tracking-[0.2em] text-accent-11">
								Crewcall Pro
							</p>

							<h1 className="mt-4 text-7 font-bold tracking-tight text-gray-12 sm:text-8">
								Unlock your hiring desk
							</h1>

							<p className="mt-4 text-4 leading-relaxed text-gray-10">
								You&apos;ve set up your workspace. Start a free 3-day trial of
								Crewcall Pro to open roles, review applicants, and build a
								bench you can trust.
							</p>

							<ul className="mt-6 space-y-3 text-left text-3 text-gray-11">
								<li className="flex items-start gap-3">
									<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-a3 text-2 font-bold text-accent-11">
										✓
									</span>
									<span>Role templates for clippers, mods, VAs &amp; custom hires</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-a3 text-2 font-bold text-accent-11">
										✓
									</span>
									<span>Application review queue &amp; bench management</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-a3 text-2 font-bold text-accent-11">
										✓
									</span>
									<span>Shareable apply links for every role</span>
								</li>
							</ul>

							<div className="mt-8">
								<Link
									href={CREWCALL_PRO_URL}
									target="_blank"
									rel="noreferrer"
									className="inline-flex w-full items-center justify-center rounded-xl bg-accent-9 px-5 py-3.5 text-4 font-semibold text-white transition hover:bg-accent-10"
								>
									Start free 3-day trial
								</Link>
							</div>

							<p className="mt-4 text-2 text-gray-9">
								Then $29.99/month or $279.99/year. Cancel anytime.
							</p>
						</div>
					</div>
				</main>
			);
		}
	} catch (error) {
		console.error("Crewcall access check failed:", error);
		return (
			<main className="min-h-screen px-5 py-16">
				<div className="mx-auto max-w-xl rounded-3xl border border-red-a5 bg-red-a2 p-8 text-center">
					<h1 className="text-7 font-bold text-gray-12">Access check unavailable</h1>
					<p className="mt-3 text-4 text-gray-10">
						We could not verify your Crewcall Pro membership. Please try again in a
						moment.
					</p>
				</div>
			</main>
		);
	}

	return children;
}
