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

	return <form onSubmit={save} className="grid gap-4">
		<SettingsSection eyebrow="Workspace" title="Your hiring desk">
			<div className="grid gap-4 sm:grid-cols-2">
				<label className="grid gap-2 text-3 font-medium text-gray-11 sm:col-span-2">Workspace name<input required value={name} onChange={(event) => setName(event.target.value)} className="premium-control px-4 py-3 text-4" /></label>
				<label className="grid gap-2 text-3 font-medium text-gray-11">Default hiring type<select value={hiringType} onChange={(event) => setHiringType(event.target.value as HiringType)} className="premium-control p-3 text-4">{hiringTypes.map((type) => <option key={type} value={type}>{hiringTypeLabels[type]}</option>)}</select></label>
				<label className="grid gap-2 text-3 font-medium text-gray-11">Default timezone<select defaultValue="UTC" className="premium-control p-3 text-4"><option>UTC</option><option>America/New_York</option><option>Europe/London</option><option>Africa/Lagos</option></select></label>
			</div>
		</SettingsSection>
		<SettingsSection eyebrow="Hiring defaults" title="Start every role with the right shape">
			<div className="grid gap-4 sm:grid-cols-3">
				<label className="grid gap-2 text-3 font-medium text-gray-11">Default pay model<select defaultValue="per_clip" className="premium-control p-3 text-4"><option value="cpm">CPM</option><option value="per_clip">Per clip / item</option><option value="flat_fee">Flat fee</option><option value="hourly">Hourly</option><option value="per_task">Per task</option></select></label>
				<label className="grid gap-2 text-3 font-medium text-gray-11">Default currency<select defaultValue="USD" className="premium-control p-3 text-4"><option>USD $</option><option>EUR €</option><option>GBP £</option><option>NGN ₦</option></select></label>
				<label className="grid gap-2 text-3 font-medium text-gray-11">Capacity unit<select defaultValue="per_week" className="premium-control p-3 text-4"><option value="per_week">Per week</option><option value="per_month">Per month</option></select></label>
			</div>
			<label className="mt-4 grid gap-2 text-3 font-medium text-gray-11">Application welcome message<textarea rows={3} placeholder="A short note applicants see before they start." className="premium-control p-3 text-4" /></label>
		</SettingsSection>
		<SettingsSection eyebrow="Notifications" title="Stay close to the pipeline">
			<div className="grid gap-3 sm:grid-cols-2">
				<label className="flex items-center gap-3 rounded-xl border border-gray-a4 bg-gray-a3 p-3 text-3 text-gray-11"><input type="checkbox" defaultChecked /> Applicant alerts</label>
				<label className="flex items-center gap-3 rounded-xl border border-gray-a4 bg-gray-a3 p-3 text-3 text-gray-11"><input type="checkbox" defaultChecked /> Bench capacity warnings</label>
			</div>
			<label className="mt-4 grid max-w-xs gap-2 text-3 font-medium text-gray-11">Digest frequency<select defaultValue="daily" className="premium-control p-3 text-4"><option value="realtime">Real-time</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
		</SettingsSection>
		<SettingsSection eyebrow="Membership" title="Crewcall Pro">
			<div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-4 font-semibold text-gray-12">Your hiring command center</p><p className="mt-1 text-3 text-gray-9">$29.99/month or $279.99/year with a 3-day free trial.</p></div><a href="https://whop.com/crewcall/crewcall-pro/" target="_blank" rel="noreferrer" className="button-link">Manage membership in Whop ↗</a></div>
		</SettingsSection>
		{error && <p className="text-3 text-red-10">{error}</p>}
		{message && <p className="text-3 text-green-10">{message}</p>}
		<div className="flex justify-end pt-2"><Button type="submit" variant="classic" size="3" disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button></div>
		<section className="mt-6 rounded-2xl border border-red-10/20 bg-red-10/5 p-5"><p className="page-kicker text-red-10">Danger zone</p><h2 className="mt-2 text-4 font-semibold text-gray-12">Destructive actions</h2><p className="mt-1 text-3 text-gray-9">Workspace deletion and data exports will live here when enabled.</p></section>
	</form>;
}

function SettingsSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
	return <section className="premium-surface p-5 sm:p-6"><p className="page-kicker">{eyebrow}</p><h2 className="mt-2 text-5 font-semibold tracking-tight text-gray-12">{title}</h2><div className="mt-5">{children}</div></section>;
}
