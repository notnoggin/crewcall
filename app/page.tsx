import Link from "next/link";

export default function Page() {
	return (
		<main className="min-h-screen px-5 py-8 sm:px-8">
			<div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
				<header className="flex items-center justify-between">
					<div className="crewcall-logo-chip">
						<img src="/crewcall-logo-modified.png" alt="Crewcall" className="h-full w-full object-contain" />
					</div>
					<span className="page-kicker">Hiring operations, refined</span>
				</header>
				<section className="flex flex-1 items-center py-20">
					<div className="max-w-3xl">
						<p className="page-kicker">Crewcall</p>
						<h1 className="page-title mt-4 max-w-2xl text-5xl sm:text-7xl">Build a bench you can trust.</h1>
						<p className="page-subtitle mt-6 max-w-xl text-base sm:text-lg">
							A calm, focused hiring pipeline for creators and teams building their next roster.
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<Link href="/discover" className="button-link">Explore Crewcall</Link>
							<a href="https://whop.com/crewcall/crewcall-pro/" target="_blank" rel="noreferrer" className="button-link">Get Crewcall Pro ↗</a>
						</div>
					</div>
				</section>
				<footer className="border-t border-gray-a4 py-5 text-3 text-gray-9">
					Hiring pipelines inside Whop.
				</footer>
			</div>
		</main>
	);
}
