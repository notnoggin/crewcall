"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@whop/react/components";

export type Role = { id: string; title: string; type: string; description: string; status: string; capacity: number; intake_mode: string; seat_cap: number | null; platforms: string[]; pay_model: string | null; rate_offered: number | null; rate_currency?: string | null; workspace_name?: string | null; workspaces?: { name?: string | null } | { name?: string | null }[] | null; creator_name: string | null; niche: string | null; rules: string | null; start_date: string | null; deadline: string | null; applicantCount?: number; seatsFilled?: number };

export function RoleCard({ role, companyId }: { role: Role; companyId: string }) {
	const router = useRouter();
	const [shareOpen, setShareOpen] = useState(false);
	const [message, setMessage] = useState("");
	async function action(method: "PATCH" | "DELETE", action?: string) {
		const response = await fetch("/api/roles", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roleId: role.id, action }) });
		const data = await response.json();
		if (!response.ok) { setMessage(data.error || "Role action failed."); return; }
		router.refresh();
	}
	return <article className="role-card p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-5 font-semibold tracking-tight text-gray-12">{role.title}</h3><p className="mt-1 text-3 text-gray-9">{role.type} · {role.intake_mode === "limited_seats" ? `${role.seat_cap} seats` : "roster"}</p></div><span className="status-pill" data-status={role.status}>{role.status}</span></div>{role.description && <p className="mt-4 max-w-3xl text-3 leading-6 text-gray-10">{role.description}</p>}<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-3 text-gray-9"><span><strong className="tabular-nums text-gray-12">{role.applicantCount ?? 0}</strong> applicants</span>{role.intake_mode === "limited_seats" && <span><strong className="tabular-nums text-gray-12">{role.seatsFilled ?? 0} / {role.seat_cap}</strong> seats filled</span>}</div><div className="mt-5 flex flex-wrap gap-2"><Button size="2" variant="classic" onClick={() => setShareOpen(true)}>Share</Button>{role.status !== "open" && <Button size="2" variant="classic" onClick={() => action("PATCH", "publish")}>Publish / Open</Button>}{role.status === "open" && <Button size="2" variant="classic" onClick={() => action("PATCH", "pause")}>Pause</Button>}{role.status !== "closed" && <Button size="2" variant="classic" onClick={() => action("PATCH", "close")}>Close</Button>}{role.status === "draft" && <Button size="2" variant="classic" onClick={() => action("DELETE")}>Delete</Button>}<Link className="button-link" href={`/dashboard/${companyId}/roles/${role.id}`}>Review queue →</Link>{message && <span className="self-center text-3 text-red-10">{message}</span>}</div>{shareOpen && <RoleSharePanel role={role} onClose={() => setShareOpen(false)} />}</article>;
}

export function RoleSharePanel({ role, onClose }: { role: Role; onClose?: () => void }) {
	const router = useRouter();
	const [copied, setCopied] = useState("");
	const publicOrigin = (process.env.NEXT_PUBLIC_APP_URL || "https://crewcall-ten.vercel.app").replace(/\/$/, "");
	const link = `${publicOrigin}/apply/${role.id}`;
	const workspace = Array.isArray(role.workspaces) ? role.workspaces[0] : role.workspaces;
	const workspaceName = role.workspace_name || workspace?.name;
	const caption = workspaceName ? `Apply to ${workspaceName}'s roster for ${role.title}.` : `Apply for ${role.title}.`;
	async function copy(value: string, label: string) { await navigator.clipboard.writeText(value); setCopied(label); }
	const close = onClose || (() => router.back());
	return <div className="fixed inset-0 z-30 flex items-center justify-center bg-black-a6 p-5" role="dialog" aria-modal="true" aria-labelledby="share-role-title"><div className="w-full max-w-2xl rounded-3xl border border-gray-a5 bg-gray-1 p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 id="share-role-title" className="text-6 font-bold text-gray-12">Share your role</h2><Button size="2" variant="classic" onClick={close}>Close</Button></div><div className="mt-5 grid gap-4"><img src={`/api/banner/${role.id}`} alt="Role share banner" width="1200" height="630" className="w-full rounded-2xl border border-gray-a5" /><p className="text-3 text-gray-10">{caption}</p><div className="grid gap-2"><label htmlFor="public-apply-link" className="text-3 font-semibold text-gray-12">Public apply link</label><div className="flex gap-2"><input id="public-apply-link" readOnly value={link} className="min-w-0 flex-1 rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><Button size="2" onClick={() => copy(link, "Link")}>Copy</Button></div></div>{copied && <p className="text-3 text-green-10" role="status">{copied} copied.</p>}</div></div></div>;
}
