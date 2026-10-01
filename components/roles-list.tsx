"use client";

import { useMemo, useState } from "react";
import { RoleCard, type Role } from "@/components/role-card";

type RoleWithStats = Role & { applicantCount: number; seatsFilled: number };

export function RolesList({ roles, companyId }: { roles: RoleWithStats[]; companyId: string }) {
	const [filter, setFilter] = useState("all");
	const visible = useMemo(() => filter === "all" ? roles : roles.filter((role) => role.status === filter), [filter, roles]);
	return <div className="grid gap-5"><div className="inline-flex w-fit rounded-xl border border-gray-a5 bg-gray-a3 p-1">{["all", "open", "draft", "closed"].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-3 font-semibold transition ${filter === item ? "bg-gray-1 text-gray-12 shadow-sm" : "text-gray-9 hover:text-gray-12"}`}>{item === "all" ? "All roles" : item[0].toUpperCase() + item.slice(1)}</button>)}</div>{visible.map((role) => <RoleCard key={role.id} role={role} companyId={companyId} />)}{!visible.length && <div className="premium-surface p-12 text-center"><p className="text-5 font-semibold text-gray-12">Nothing here yet</p><p className="mt-2 text-3 text-gray-9">Try another view or create your first campaign.</p></div>}</div>;
}
