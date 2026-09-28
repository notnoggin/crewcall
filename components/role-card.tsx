"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@whop/react/components";

export type Role = { id: string; title: string; type: string; description: string; status: string; capacity: number; intake_mode: string; seat_cap: number | null; platforms: string[]; pay_model: string | null; rate_offered: number | null; creator_name: string | null; niche: string | null; rules: string | null; start_date: string | null; deadline: string | null; applicantCount?: number; seatsFilled?: number };

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
	return <article className="rounded-2xl border border-gray-a5 bg-gray-a2 p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-5 font-semibold text-gray-12">{role.title}</h3><p className="mt-1 text-3 text-gray-10">{role.type} · {role.intake_mode === "limited_seats" ? `${role.seat_cap} seats` : "roster"}</p></div><span className="rounded-full bg-gray-a4 px-3 py-1 text-2 font-semibold uppercase text-gray-11">{role.status}</span></div>{role.description && <p className="mt-4 text-3 text-gray-10">{role.description}</p>}<div className="mt-3 flex flex-wrap gap-3 text-3 text-gray-10"><span>{role.applicantCount ?? 0} applicants</span>{role.intake_mode === "limited_seats" && <span>{role.seatsFilled ?? 0} / {role.seat_cap} seats filled</span>}</div><div className="mt-4 flex flex-wrap gap-3"><Button size="2" variant="classic" onClick={() => setShareOpen(true)}>Share</Button>{role.status !== "open" && <Button size="2" variant="classic" onClick={() => action("PATCH", "publish")}>Publish / Open</Button>}{role.status === "open" && <Button size="2" variant="classic" onClick={() => action("PATCH", "pause")}>Pause</Button>}{role.status !== "closed" && <Button size="2" variant="classic" onClick={() => action("PATCH", "close")}>Close</Button>}{role.status === "draft" && <Button size="2" variant="classic" onClick={() => action("DELETE")}>Delete</Button>}<Link className="self-center text-3 font-semibold text-accent-11 underline" href={`/dashboard/${companyId}/roles/${role.id}`}>Review queue</Link>{message && <span className="self-center text-3 text-red-10">{message}</span>}</div>{shareOpen && <RoleSharePanel role={role} onClose={() => setShareOpen(false)} />}</article>;
}

export function RoleSharePanel({ role, onClose }: { role: Role; onClose?: () => void }) {
	const router = useRouter();
	const [copied, setCopied] = useState("");
	const link = `${window.location.origin}/apply/${role.id}`;
	const caption = `${role.title} — apply to the Crewcall roster: ${link}`;
	async function copy(value: string, label: string) { await navigator.clipboard.writeText(value); setCopied(label); }
	const close = onClose || (() => router.back());
	return <div className="fixed inset-0 z-30 flex items-center justify-center bg-black-a6 p-5"><div className="w-full max-w-2xl rounded-3xl border border-gray-a5 bg-gray-1 p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-6 font-bold text-gray-12">Share role</h2><Button size="2" variant="classic" onClick={close}>Close</Button></div><div className="mt-5 grid gap-4"><img src={`/api/banner/${role.id}`} alt="" className="w-full rounded-2xl border border-gray-a5" /><a className="text-3 text-accent-11 underline" href={`/api/banner/${role.id}`} download={`${role.title}-crewcall.png`}>Download banner</a><div className="grid gap-2"><label className="text-3 font-semibold text-gray-12">Public apply link</label><div className="flex gap-2"><input readOnly value={link} className="min-w-0 flex-1 rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><Button size="2" onClick={() => copy(link, "link")}>Copy</Button></div></div><div className="grid gap-2"><label className="text-3 font-semibold text-gray-12">Suggested caption</label><textarea readOnly value={caption} rows={3} className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><Button size="2" onClick={() => copy(caption, "caption")}>Copy caption</Button></div>{copied && <p className="text-3 text-green-10">{copied} copied.</p>}</div></div></div>;
}
