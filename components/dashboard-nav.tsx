"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardNav({ companyId }: { companyId: string }) {
	const pathname = usePathname();
	const items = [
		["Home", `/dashboard/${companyId}`],
		["Roles", `/dashboard/${companyId}/roles`],
		["Bench", `/dashboard/${companyId}/roster`],
		["Settings", `/dashboard/${companyId}/settings`],
	];
	return <nav className="dashboard-nav"><div className="nav-links"><Link href={`/dashboard/${companyId}`} aria-label="Crewcall home" className="crewcall-logo-chip"><img src="/crewcall-logo-modified.png" alt="" className="crewcall-logo h-full w-full object-contain" /></Link>{items.map(([label, href]) => <Link key={href} href={href} data-active={pathname === href || (label !== "Home" && pathname.startsWith(`${href}/`))} className="nav-link"><span>{label}</span><span aria-hidden="true" className="sm:hidden">{label[0]}</span></Link>)}</div><ThemeToggle /></nav>;
}
