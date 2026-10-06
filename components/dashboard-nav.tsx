"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardNav({ companyId }: { companyId: string }) {
	const pathname = usePathname();
	const items = [
		{ label: "Home", href: `/dashboard/${companyId}`, match: (path: string) => path === `/dashboard/${companyId}` },
		{
			label: "Roles",
			href: `/dashboard/${companyId}/roles`,
			match: (path: string) => path.startsWith(`/dashboard/${companyId}/roles`),
		},
		{
			label: "Bench",
			href: `/dashboard/${companyId}/roster`,
			match: (path: string) => path.startsWith(`/dashboard/${companyId}/roster`),
		},
		{
			label: "Settings",
			href: `/dashboard/${companyId}/settings`,
			match: (path: string) => path.startsWith(`/dashboard/${companyId}/settings`),
		},
	];

	return (
		<nav className="dashboard-nav" aria-label="Dashboard">
			<div className="nav-links">
				<Link href={`/dashboard/${companyId}`} aria-label="Crewcall home" className="crewcall-logo-chip">
					<img
						src="/crewcall-logo-modified.png"
						alt=""
						className="crewcall-logo h-full w-full object-contain"
					/>
				</Link>
				{items.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						data-active={item.match(pathname)}
						className="nav-link"
					>
						<span className="nav-link-label">{item.label}</span>
					</Link>
				))}
			</div>
			<ThemeToggle />
		</nav>
	);
}
