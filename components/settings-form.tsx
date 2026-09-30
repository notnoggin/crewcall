"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import { hiringTypeLabels, hiringTypes, type HiringType } from "@/lib/hiring";

export function SettingsForm({ companyId, initialName, initialHiringType }: { companyId: string; initialName: string; initialHiringType: HiringType }) {
	const [name, setName] = useState(initialName);
	const [hiringType, setHiringType] = useState<HiringType>(initialHiringType);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	async function save(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setMessage("");
		setError("");
		const response = await fetch("/api/workspaces/settings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ companyId, name, hiringType }),
		});
		const data = await response.json();
		setSaving(false);
		if (!response.ok) {
			setError(data.error || "Could not save settings.");
			return;
		}
		setMessage("Settings saved.");
	}

	return <form onSubmit={save} className="grid gap-5">
		<label className="grid gap-2 text-3 font-medium text-gray-11">Workspace name<input required value={name} onChange={(event) => setName(event.target.value)} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12" /></label>
		<label className="grid gap-2 text-3 font-medium text-gray-11">Default hiring type<select value={hiringType} onChange={(event) => setHiringType(event.target.value as HiringType)} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12">{hiringTypes.map((type) => <option key={type} value={type}>{hiringTypeLabels[type]}</option>)}</select></label>
		{error && <p className="text-3 text-red-10">{error}</p>}
		{message && <p className="text-3 text-green-11">{message}</p>}
		<Button type="submit" variant="classic" size="3" disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>
		<div className="border-t border-gray-a5 pt-5">
			<p className="text-3 uppercase tracking-[0.16em] text-gray-9">Membership</p>
			<h2 className="mt-2 text-5 font-semibold text-gray-12">Crewcall Pro</h2>
			<p className="mt-1 text-3 text-gray-10">$29.99/month or $279.99/year (20% annual discount).</p>
			<a href="https://whop.com/crewcall/crewcall-pro/" target="_blank" rel="noreferrer" className="mt-3 inline-block text-3 font-semibold text-accent-11 underline">Manage membership in Whop</a>
		</div>
	</form>;
}
