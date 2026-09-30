import Link from "next/link";
import { hasCrewcallAccess, CREWCALL_PRO_URL } from "@/lib/crewcall-access";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	try {
		const { hasAccess } = await hasCrewcallAccess();
		if (!hasAccess) {
			return <main className="min-h-screen px-5 py-16"><div className="mx-auto max-w-xl rounded-3xl border border-gray-a5 bg-gray-a2 p-8 text-center"><p className="text-3 font-semibold uppercase tracking-[0.2em] text-gray-9">Crewcall Pro</p><h1 className="mt-3 text-8 font-bold text-gray-12">Start your 3-day free trial</h1><p className="mt-3 text-4 text-gray-10">Crewcall is available with Crewcall Pro. Your Whop trial gives you access now, then continues at $29.99/month or $279.99/year.</p><Link href={CREWCALL_PRO_URL} target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-xl bg-accent-9 px-5 py-3 text-4 font-semibold text-white">Get Crewcall Pro</Link></div></main>;
		}
	} catch (error) {
		console.error("Crewcall access check failed:", error);
		return <main className="min-h-screen px-5 py-16"><div className="mx-auto max-w-xl rounded-3xl border border-red-a5 bg-red-a2 p-8 text-center"><h1 className="text-7 font-bold text-gray-12">Access check unavailable</h1><p className="mt-3 text-4 text-gray-10">We could not verify your Crewcall Pro membership. Please try again.</p></div></main>;
	}
	return children;
}
