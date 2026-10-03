"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleCard, type Role } from "@/components/role-card";

type RoleWithStats = Role & { applicantCount: number; seatsFilled: number };

export function RolesList({ roles, companyId }: { roles: RoleWithStats[]; companyId: string }) {
	const [filter, setFilter] = useState("all");
	const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
	const visible = useMemo(() => filter === "all" ? roles : roles.filter((role) => role.status === filter), [filter, roles]);

	useEffect(() => {
		setActiveRoleId(visible[0]?.id || null);
		if (visible.length <= 6) return;
		const observer = new IntersectionObserver((entries) => {
			const inView = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
			if (inView) setActiveRoleId(inView.target.id.replace("role-section-", ""));
		}, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
		const sections = visible.map((role) => document.getElementById(`role-section-${role.id}`)).filter((section): section is HTMLElement => Boolean(section));
		sections.forEach((section) => observer.observe(section));
		return () => observer.disconnect();
	}, [visible]);

	function jumpToRole(roleId: string) {
		document.getElementById(`role-section-${roleId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
		setActiveRoleId(roleId);
	}

	return <div className="relative grid gap-5"><div className="role-filters"><span className="px-2 text-3 font-semibold text-gray-10">Filter roles</span><div className="role-filter-group">{["all", "open", "draft", "closed"].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-3 font-semibold transition ${filter === item ? "bg-gray-1 text-gray-12 shadow-sm" : "text-gray-9 hover:text-gray-12"}`}>{item === "all" ? "All roles" : item[0].toUpperCase() + item.slice(1)}</button>)}</div></div>{visible.length > 6 && <nav className="roles-scroll-spy" aria-label="Jump to role"><span className="roles-scroll-spy-label">On this page</span>{visible.map((role) => <button key={role.id} type="button" className={activeRoleId === role.id ? "is-active" : ""} onClick={() => jumpToRole(role.id)} title={role.title}><span aria-hidden="true" />{role.title.length > 22 ? `${role.title.slice(0, 22)}…` : role.title}</button>)}</nav>}{visible.map((role) => <section key={role.id} id={`role-section-${role.id}`} className="scroll-mt-28"><RoleCard role={role} companyId={companyId} /></section>)}{!visible.length && <div className="premium-surface p-12 text-center"><p className="text-5 font-semibold text-gray-12">Nothing here yet</p><p className="mt-2 text-3 text-gray-9">Try another view or create your first campaign.</p></div>}</div>;
}
