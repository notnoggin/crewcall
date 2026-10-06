"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@whop/react/components";

export type Role = {
	id: string;
	title: string;
	type: string;
	description: string;
	status: string;
	capacity: number;
	intake_mode: string;
	seat_cap: number | null;
	platforms: string[];
	pay_model: string | null;
	rate_offered: number | null;
	rate_currency?: string | null;
	workspace_name?: string | null;
	workspaces?: { name?: string | null } | { name?: string | null }[] | null;
	creator_name: string | null;
	niche: string | null;
	rules: string | null;
	start_date: string | null;
	deadline: string | null;
	applicantCount?: number;
	seatsFilled?: number;
};

export function RoleCard({ role, companyId }: { role: Role; companyId: string }) {
	const router = useRouter();
	const [shareOpen, setShareOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);

	async function action(method: "PATCH" | "DELETE", actionName?: string) {
		if (method === "DELETE" && !window.confirm(`Delete "${role.title}"? This cannot be undone.`)) return;
		setBusy(true);
		setMessage("");
		const response = await fetch("/api/roles", {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ roleId: role.id, action: actionName }),
		});
		const data = await response.json();
		setBusy(false);
		if (!response.ok) {
			setMessage(data.error || "Role action failed.");
			return;
		}
		router.refresh();
	}

	const intakeLabel =
		role.intake_mode === "limited_seats" ? `${role.seat_cap ?? 0} seats` : "Open bench";

	return (
		<article className="role-card">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<h3 className="text-5 font-semibold tracking-tight text-gray-12">{role.title}</h3>
					<p className="mt-1.5 text-3 text-gray-9">
						<span className="capitalize">{role.type}</span>
						<span className="mx-1.5 opacity-40">·</span>
						{intakeLabel}
					</p>
				</div>
				<span className="status-pill shrink-0" data-status={role.status}>
					{role.status}
				</span>
			</div>

			{role.description ? (
				<p className="mt-4 max-w-3xl text-3 leading-6 text-gray-10">{role.description}</p>
			) : null}

			<div className="role-card-stats">
				<div className="role-card-stat">
					<span className="role-card-stat-value">{role.applicantCount ?? 0}</span>
					<span className="role-card-stat-label">Applicants</span>
				</div>
				{role.intake_mode === "limited_seats" ? (
					<div className="role-card-stat">
						<span className="role-card-stat-value">
							{role.seatsFilled ?? 0}/{role.seat_cap}
						</span>
						<span className="role-card-stat-label">Seats filled</span>
					</div>
				) : null}
			</div>

			<div className="role-card-actions">
				<button type="button" className="btn-secondary" disabled={busy} onClick={() => setShareOpen(true)}>
					Share
				</button>
				{role.status !== "open" ? (
					<button type="button" className="btn-secondary" disabled={busy} onClick={() => action("PATCH", "publish")}>
						Publish
					</button>
				) : null}
				{role.status === "open" ? (
					<button type="button" className="btn-secondary" disabled={busy} onClick={() => action("PATCH", "pause")}>
						Pause
					</button>
				) : null}
				{role.status !== "closed" ? (
					<button type="button" className="btn-secondary" disabled={busy} onClick={() => action("PATCH", "close")}>
						Close
					</button>
				) : null}
				<button type="button" className="btn-ghost-danger" disabled={busy} onClick={() => action("DELETE")}>
					Delete
				</button>
				<Link className="button-link role-card-primary-link" href={`/dashboard/${companyId}/roles/${role.id}`}>
					Review queue →
				</Link>
			</div>
			{message ? <p className="mt-3 text-3 text-red-10">{message}</p> : null}
			{shareOpen ? <RoleSharePanel role={role} onClose={() => setShareOpen(false)} /> : null}
		</article>
	);
}

export function RoleSharePanel({ role, onClose }: { role: Role; onClose?: () => void }) {
	const router = useRouter();
	const [copied, setCopied] = useState("");
	const publicOrigin = (process.env.NEXT_PUBLIC_APP_URL || "https://crewcall-ten.vercel.app").replace(/\/$/, "");
	const link = `${publicOrigin}/apply/${role.id}`;
	const workspace = Array.isArray(role.workspaces) ? role.workspaces[0] : role.workspaces;
	const workspaceName = role.workspace_name || workspace?.name;
	const caption = workspaceName
		? `Apply to ${workspaceName}'s bench for ${role.title}.`
		: `Apply for ${role.title}.`;

	async function copy(value: string, label: string) {
		await navigator.clipboard.writeText(value);
		setCopied(label);
	}

	const close = useCallback(() => {
		if (onClose) onClose();
		else router.back();
	}, [onClose, router]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") close();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [close]);

	const dialog = (
		<div
			className="premium-overlay"
			role="dialog"
			aria-modal="true"
			aria-labelledby="share-role-title"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) close();
			}}
		>
			<div className="premium-modal" onMouseDown={(event) => event.stopPropagation()}>
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="page-kicker">Share</p>
						<h2 id="share-role-title" className="section-title mt-1">
							Share your role
						</h2>
					</div>
					<button type="button" className="btn-secondary" onClick={close}>
						Close
					</button>
				</div>
				<div className="mt-6 grid gap-4">
					<img
						src="/crewcall-share-banner.png"
						alt="Crewcall share banner"
						width={1200}
						height={630}
						className="w-full rounded-2xl border border-gray-a5"
					/>
					<p className="text-3 leading-6 text-gray-10">{caption}</p>
					<div className="grid gap-2">
						<label htmlFor="public-apply-link" className="text-3 font-semibold text-gray-12">
							Public apply link
						</label>
						<div className="flex gap-2">
							<input
								id="public-apply-link"
								readOnly
								value={link}
								className="premium-control min-w-0 flex-1 px-3 py-2.5 text-3"
							/>
							<Button className="h-10 min-w-20 shrink-0 whitespace-nowrap" size="2" onClick={() => copy(link, "Link")}>
								Copy
							</Button>
						</div>
					</div>
					{copied ? (
						<p className="text-3 text-green-10" role="status">
							{copied} copied.
						</p>
					) : null}
				</div>
			</div>
		</div>
	);

	return typeof document === "undefined" ? null : createPortal(dialog, document.body);
}
