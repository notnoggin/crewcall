"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@whop/react/components";

type RosterEntry = {
	id: string;
	person_whop_id: string | null;
	role_tag: string;
	status: "bench" | "active" | "paused" | "dismissed";
	last_active_at: string | null;
	coverage_window: string | null;
	weekly_capacity: number | null;
	timezone: string | null;
	rate_requested: number | null;
	platforms: string[];
	applicant_email: string;
	role_id: string | null;
	campaign_title: string | null;
};

type Campaign = { id: string; title: string };
type Filters = { roleTag: string; status: string; minCapacity: string; timezone: string; platform: string; maxRate: string };

const statusLabels = { bench: "Ready for next campaign", active: "Assigned", paused: "Paused", dismissed: "Dismissed" };

export function Roster({ entries, campaigns }: { entries: RosterEntry[]; campaigns: Campaign[] }) {
	const [filters, setFilters] = useState<Filters>({ roleTag: "", status: "", minCapacity: "", timezone: "", platform: "", maxRate: "" });
	const [selected, setSelected] = useState<RosterEntry | null>(null);
	const filtered = useMemo(() => entries.filter((entry) =>
		(!filters.roleTag || entry.role_tag === filters.roleTag) &&
		(!filters.status || entry.status === filters.status) &&
		(!filters.minCapacity || (entry.weekly_capacity ?? 0) >= Number(filters.minCapacity)) &&
		(!filters.timezone || (entry.timezone || "").toLowerCase().includes(filters.timezone.toLowerCase())) &&
		(!filters.platform || entry.platforms.some((platform) => platform.toLowerCase().includes(filters.platform.toLowerCase()))) &&
		(!filters.maxRate || (entry.rate_requested !== null && entry.rate_requested <= Number(filters.maxRate))),
	), [entries, filters]);

	return (
		<>
			<div className="premium-surface mb-5 grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
				<select value={filters.roleTag} onChange={(e) => setFilters({ ...filters, roleTag: e.target.value })} className="premium-control p-2 text-3"><option value="">All role tags</option>{["clipper", "moderator", "editor", "va", "ops"].map((item) => <option key={item}>{item}</option>)}</select>
				<select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="premium-control p-2 text-3"><option value="">All statuses</option>{Object.keys(statusLabels).map((item) => <option key={item} value={item}>{statusLabels[item as keyof typeof statusLabels]}</option>)}</select>
				<input value={filters.minCapacity} onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })} type="number" min="0" placeholder="Min weekly capacity" className="premium-control p-2 text-3" />
				<input value={filters.timezone} onChange={(e) => setFilters({ ...filters, timezone: e.target.value })} placeholder="Timezone" className="premium-control p-2 text-3" />
				<input value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value })} placeholder="Platform" className="premium-control p-2 text-3" />
				<input value={filters.maxRate} onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })} type="number" min="0" placeholder="Max rate" className="premium-control p-2 text-3" />
			</div>
			<div className="table-shell">
				<table className="min-w-[900px] w-full text-left text-3">
					<thead><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Last active</th><th className="p-4">Campaign</th><th className="p-4">Coverage</th><th className="p-4">Capacity / rate</th></tr></thead>
					<tbody>{filtered.map((entry) => <tr key={entry.id} onClick={() => setSelected(entry)} className="cursor-pointer"><td className="p-4"><strong className="text-gray-12">{entry.applicant_email}</strong><span className="block text-2 text-gray-9">{entry.person_whop_id || "Applied without a Whop account · email notifications"}</span></td><td className="p-4 text-gray-10">{entry.role_tag}</td><td className="p-4"><span className="status-pill" data-status={entry.status}>{entry.status}</span></td><td className="p-4 text-gray-10">{entry.last_active_at ? new Date(entry.last_active_at).toLocaleDateString() : "—"}</td><td className="p-4 text-gray-10">{entry.campaign_title || "—"}</td><td className="p-4 text-gray-10">{entry.role_tag === "moderator" ? entry.coverage_window || "—" : "—"}</td><td className="p-4 tabular-nums text-gray-10">{entry.weekly_capacity ?? "—"} / week · {entry.rate_requested === null ? "—" : `$${entry.rate_requested}`}</td></tr>)}</tbody>
				</table>
				{!filtered.length && <p className="p-10 text-center text-3 text-gray-9">No bench members match these filters. Try widening the bench search.</p>}
			</div>
			{selected && <RosterDrawer entry={selected} campaigns={campaigns} onClose={() => setSelected(null)} />}
		</>
	);
}

function RosterDrawer({ entry, campaigns, onClose }: { entry: RosterEntry; campaigns: Campaign[]; onClose: () => void }) {
	const [reason, setReason] = useState("");
	const [roleId, setRoleId] = useState(campaigns[0]?.id || "");
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);
	const [history, setHistory] = useState<{ events: { id: string; action: string; note: string | null; created_at: string }[]; tests: { id: string; brief: string; outcome: string }[] } | null>(null);
	const [dismissReason, setDismissReason] = useState("no-show");
	useEffect(() => { void loadHistory(); }, []);
	async function action(actionName: string) {
		setBusy(true); setMessage("");
		const response = await fetch(`/api/roster/${entry.id}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName, reason: actionName === "dismiss" ? dismissReason : undefined, note: reason.trim() || undefined, roleId: actionName === "assign" ? roleId : undefined }) });
		const data = await response.json(); setBusy(false);
		if (!response.ok) { setMessage(data.error || "Action failed."); return; }
		setMessage("Saved."); window.location.reload();
	}
	async function loadHistory() {
		const response = await fetch(`/api/roster/${entry.id}/history`);
		const data = await response.json();
		if (!response.ok) { setMessage(data.error || "Could not load history."); return; }
		setHistory(data);
	}
	return <div className="fixed inset-0 z-20 flex justify-end bg-black-a6" role="dialog" aria-modal="true"><div className="h-full w-full max-w-xl overflow-y-auto border-l border-gray-a5 bg-gray-1 p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="text-3 text-gray-9">{entry.role_tag}</p><h2 className="text-7 font-bold text-gray-12">{entry.applicant_email}</h2><p className="text-3 text-gray-10">{statusLabels[entry.status]}</p>{entry.person_whop_id ? <p className="mt-2 text-2 text-gray-9">Whop member notifications enabled</p> : <p className="mt-2 rounded-lg bg-gray-a3 px-3 py-2 text-2 text-gray-10">Applied without a Whop account, so status updates are sent by email.</p>}</div><Button variant="classic" size="2" onClick={onClose}>Close</Button></div><div className="grid gap-4">{entry.status === "bench" && <><select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12"><option value="">Choose campaign</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}</select><Button disabled={busy || !roleId} onClick={() => action("assign")}>Assign to campaign</Button></>}{entry.status === "active" && <Button disabled={busy} onClick={() => action("release")}>Release to bench</Button>}{entry.status !== "dismissed" && entry.status !== "paused" && <><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Optional note for this action" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><Button disabled={busy} onClick={() => action("pause")}>Pause</Button></>}{entry.status !== "dismissed" && <><select value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12"><option value="no-show">No-show</option><option value="underperformed">Underperformed</option><option value="no-longer-needed">No longer needed</option><option value="other">Other</option></select><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Optional note" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><Button disabled={busy} onClick={() => action("dismiss")}>Dismiss</Button></>}{entry.status === "paused" && <Button disabled={busy} onClick={() => action("reactivate")}>Reactivate to bench</Button>}{message && <p className="text-3 text-gray-10">{message}</p>}{history && <div className="grid gap-3"><h3 className="text-4 font-semibold text-gray-12">History</h3>{history.events.map((event) => <div key={event.id} className="rounded-xl border border-gray-a4 bg-gray-a2 p-3 text-3"><strong>{event.action}</strong><span className="block text-gray-9">{event.note || "—"} · {new Date(event.created_at).toLocaleString()}</span></div>)}{history.tests.map((test) => <div key={test.id} className="rounded-xl border border-gray-a4 bg-gray-a2 p-3 text-3"><strong>Test: {test.outcome}</strong><span className="block text-gray-9">{test.brief}</span></div>)}</div>}</div></div></div>;
}
