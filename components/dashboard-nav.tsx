import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardNav({ companyId }: { companyId: string }) {
	const items = [
		["Home", `/dashboard/${companyId}`],
		["Roles", `/dashboard/${companyId}/roles`],
		["Bench", `/dashboard/${companyId}/roster`],
		["Settings", `/dashboard/${companyId}/settings`],
	];
	return <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-a5 bg-gray-a2 p-2 shadow-sm"><div className="flex min-w-0 flex-wrap items-center gap-1"><Link href={`/dashboard/${companyId}`} aria-label="Crewcall home" className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 no-underline"><img src="/crewcall-logo-modified.png" alt="" className="crewcall-logo h-full w-full object-contain" /></Link>{items.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-4 py-2 text-3 font-semibold text-gray-10 no-underline hover:bg-gray-a4 hover:text-gray-12">{label}</Link>)}</div><ThemeToggle /></nav>;
}
