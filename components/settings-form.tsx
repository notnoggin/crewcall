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
	</form>;
}
