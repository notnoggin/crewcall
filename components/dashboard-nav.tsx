import Link from "next/link";

export function DashboardNav({ companyId }: { companyId: string }) {
	const items = [
		["Home", `/dashboard/${companyId}`],
		["Roles", `/dashboard/${companyId}/roles`],
		["Bench", `/dashboard/${companyId}/roster`],
		["Settings", `/dashboard/${companyId}/settings`],
	];
	return <nav className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-a5 bg-gray-a2 p-2">{items.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-4 py-2 text-3 font-semibold text-gray-10 hover:bg-gray-a4 hover:text-gray-12">{label}</Link>)}</nav>;
}
