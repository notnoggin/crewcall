"use client";

import { useMemo, useState } from "react";
import { RoleCard, type Role } from "@/components/role-card";

type RoleWithStats = Role & { applicantCount: number; seatsFilled: number };

export function RolesList({ roles, companyId }: { roles: RoleWithStats[]; companyId: string }) {
	const [filter, setFilter] = useState("all");
	const visible = useMemo(() => filter === "all" ? roles : roles.filter((role) => role.status === filter), [filter, roles]);
	return <div className="grid gap-4"><div className="flex flex-wrap gap-2">{["all", "open", "draft", "closed"].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-xl px-3 py-2 text-3 font-semibold ${filter === item ? "bg-accent-9 text-white" : "bg-gray-a3 text-gray-10"}`}>{item === "all" ? "All roles" : item}</button>)}</div>{visible.map((role) => <RoleCard key={role.id} role={role} companyId={companyId} />)}{!visible.length && <p className="rounded-2xl border border-dashed border-gray-a6 p-8 text-center text-4 text-gray-9">No roles match this filter.</p>}</div>;
}
