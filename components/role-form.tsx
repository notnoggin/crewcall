"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@whop/react/components";
import { currencies } from "@/lib/formatting";

const defaults: Record<string, string[]> = {
	clipper: ["pay", "platforms", "examples", "weeklyCapacity", "rateWanted", "messagingHandle"],
	moderator: ["moderatorScenarios", "moderatorHours", "moderatorTimezone", "moderatorTools"],
	va: ["vaSample", "vaTools", "vaHours", "vaTimezone", "vaEnglish", "vaWontDo", "vaRate", "vaSops"],
	custom: [],
};

const labels: Record<string, string> = {
	pay: "Pay details", platforms: "Platforms", creatorName: "Creator / brand name", niche: "Niche", geo: "Geo", languages: "Languages", rules: "Rules", examples: "Example clip links", sourceFootage: "Source footage", minAvgViews: "Minimum average views", dates: "Start and end dates", weeklyCapacity: "Weekly capacity", timezone: "Timezone", rateWanted: "Rate wanted", messagingHandle: "Discord or Telegram handle", canStartSameDay: "Same-day start", moderatorScenarios: "Scenario questions", moderatorHours: "Hours available", moderatorTimezone: "Coverage window", moderatorLanguages: "Languages", moderatorTools: "Tools", moderatorExperience: "Ban / mute experience", moderatorStyle: "Script or improvise", vaSample: "Work sample", vaTools: "Tools", vaHours: "Hours", vaEnglish: "English level", vaWontDo: "What they won't do", vaRate: "Rate type and amount", vaSops: "SOP readiness",
};

export function RoleForm({ workspaceId, companyId, defaultType }: { workspaceId: string; companyId: string; defaultType: string }) {
	const router = useRouter();
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [intakeMode, setIntakeMode] = useState("roster");
	const [roleType, setRoleType] = useState(defaultType);
	const [activeFields, setActiveFields] = useState(defaults[defaultType] || []);
	const removedFields = (defaults[roleType] || []).filter((field) => !activeFields.includes(field));

	function changeType(type: string) {
		setRoleType(type);
		setActiveFields(defaults[type] || []);
	}
	function removeField(field: string) {
		setActiveFields((current) => current.filter((item) => item !== field));
	}
	function restoreField(field: string) {
		setActiveFields((current) => [...current, field]);
	}
	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");
		const formData = new FormData(event.currentTarget);
		formData.set("activeFields", JSON.stringify(activeFields));
		const saveDraft = formData.get("saveDraft") === "true";
		const response = await fetch("/api/roles", { method: "POST", body: formData });
		if (!response.ok) {
			setError((await response.json()).error || "Could not create the role.");
			setSaving(false);
			return;
		}
		const data = await response.json();
		setSaving(false);
		router.push(saveDraft ? `/dashboard/${companyId}/roles` : `/dashboard/${companyId}/roles/${data.roleId}?share=1`);
	}

	return <form onSubmit={submit} className="grid gap-5">
		<input type="hidden" name="workspaceId" value={workspaceId} />
		<label className="grid gap-2 text-3 font-medium text-gray-11">Title<input required name="title" placeholder="Acme: TikTok clipping, Q4" className="premium-control px-4 py-3 text-4" /></label>
		<label className="grid gap-2 text-3 font-medium text-gray-11">Role type<select required name="type" value={roleType} onChange={(event) => changeType(event.target.value)} className="premium-control p-3 text-4"><option value="clipper">Clipper</option><option value="moderator">Moderator</option><option value="va">VA</option><option value="custom">Custom</option></select></label>
		<label className="grid gap-2 text-3 font-medium text-gray-11">Intake mode<select name="intakeMode" value={intakeMode} onChange={(event) => setIntakeMode(event.target.value)} className="premium-control p-3 text-4"><option value="roster">Bench — review applicants and add approved people</option><option value="limited_seats">Limited seats — close applications at the approved seat cap</option></select></label>
		{intakeMode === "limited_seats" && <label className="grid gap-2 text-3 font-medium text-gray-11">Seat cap<input required min="1" type="number" name="seatCap" className="premium-control px-4 py-3 text-4" /></label>}
		<RoleTypeFields roleType={roleType} activeFields={activeFields} removeField={removeField} removedFields={removedFields} restoreField={restoreField} />
		{error && <p className="text-3 text-red-10">{error}</p>}
		<div className="flex flex-wrap gap-3"><Button type="submit" name="saveDraft" value="false" variant="classic" size="4" disabled={saving}>{saving ? "Creating..." : "Create role"}</Button><Button type="submit" name="saveDraft" value="true" variant="classic" size="4" disabled={saving}>{saving ? "Saving..." : "Save draft"}</Button></div>
	</form>;
}

function RemoveField({ onRemove }: { onRemove: () => void }) { return <button type="button" onClick={onRemove} aria-label="Remove field" title="Remove field" className="field-remove">×</button>; }
function Slot({ active, onRemove, children }: { active: boolean; onRemove: () => void; children: React.ReactNode }) { return active ? <div className="relative rounded-xl border border-gray-a4 p-3"><RemoveField onRemove={onRemove} />{children}</div> : null; }
function Input({ label, name, type = "text" }: { label: string; name: string; type?: string }) { return <label className="grid gap-2 text-3 font-medium text-gray-11">{label}<input name={name} type={type} className="premium-control px-4 py-3 text-4" /></label>; }
function PayFields({ activeFields, removeField }: { activeFields: string[]; removeField: (field: string) => void }) { return <Slot active={activeFields.includes("pay")} onRemove={() => removeField("pay")}><p className="mb-3 text-4 font-semibold text-gray-12">Display-only pay details</p><p className="mb-3 text-2 text-gray-9">Shown to applicants only. Crewcall does not calculate or settle payments.</p><div className="grid gap-3 sm:grid-cols-[1fr_130px]"><select name="payModel" className="premium-control p-3 text-3"><option value="">Pay model</option><option value="cpm">CPM</option><option value="per_clip">Per clip/item</option><option value="flat_fee">Flat fee</option><option value="hourly">Hourly</option><option value="per_task">Per task</option><option value="custom">Custom</option></select><select name="rateCurrency" defaultValue="USD" className="premium-control p-3 text-3">{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}</select></div><input name="rateOffered" type="number" min="0" step="0.01" placeholder="Rate offered" className="premium-control mt-3 px-4 py-3 text-3" /></Slot>; }
function RemovedFields({ fields, restoreField }: { fields: string[]; restoreField: (field: string) => void }) { if (!fields.length) return null; return <details className="rounded-xl border border-dashed border-gray-a5 p-3"><summary className="cursor-pointer text-3 font-semibold text-gray-10">Removed fields ({fields.length})</summary><div className="mt-3 grid gap-2">{fields.map((field) => <div key={field} className="flex items-center justify-between gap-3 rounded-lg bg-gray-a3 px-3 py-2 text-3 text-gray-11"><span>{labels[field] || field}</span><button type="button" onClick={() => restoreField(field)} className="button-link px-2 py-1 text-2">Add back</button></div>)}</div></details>; }

function RoleTypeFields({ roleType, activeFields, removeField, removedFields, restoreField }: { roleType: string; activeFields: string[]; removeField: (field: string) => void; removedFields: string[]; restoreField: (field: string) => void }) {
	const active = (field: string) => activeFields.includes(field);
	const removed = <RemovedFields fields={removedFields} restoreField={restoreField} />;
	if (roleType === "custom") return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">Custom intake builder</legend><p className="text-3 text-gray-9">Build a blank application template after the role is created.</p></fieldset>;
	if (roleType === "moderator") return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">Moderator intake</legend><PayFields activeFields={activeFields} removeField={removeField} /><Slot active={active("moderatorScenarios")} onRemove={() => removeField("moderatorScenarios")}><p className="mb-2 text-3 font-medium text-gray-11">Scenario questions</p><textarea name="moderatorSpamQuestion" defaultValue="How would you handle spam?" className="premium-control mb-2 p-3 text-3" /><textarea name="moderatorRefundQuestion" defaultValue="How would you handle refund rage?" className="premium-control mb-2 p-3 text-3" /><textarea name="moderatorPayQuestion" defaultValue="What would you do if a clipper argued about pay?" className="premium-control p-3 text-3" /></Slot>{["moderatorHours", "moderatorTimezone", "moderatorLanguages", "moderatorTools", "moderatorExperience", "moderatorStyle"].map((field) => <Slot key={field} active={active(field)} onRemove={() => removeField(field)}><Input label={labels[field]} name={field} /></Slot>)}{removed}</fieldset>;
	if (roleType === "va") return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">VA intake</legend><PayFields activeFields={activeFields} removeField={removeField} />{[["vaSample", "Work sample link", "url"], ["vaTools", "Tools", "text"], ["vaHours", "Hours", "text"], ["vaTimezone", "Timezone", "text"], ["vaEnglish", "English level", "text"], ["vaRate", "Rate type and amount", "text"]].map(([field, label, type]) => <Slot key={field} active={active(field)} onRemove={() => removeField(field)}><Input label={label} name={field} type={type} /></Slot>)}<Slot active={active("vaWontDo")} onRemove={() => removeField("vaWontDo")}><label className="grid gap-2 text-3 font-medium text-gray-11">What they won&apos;t do<textarea name="vaWontDo" className="premium-control p-3 text-3" /></label></Slot><Slot active={active("vaSops")} onRemove={() => removeField("vaSops")}><label className="flex items-center gap-2 text-3 text-gray-11"><input type="checkbox" name="vaCanFollowSops" /> Can follow SOPs without a call</label></Slot>{removed}</fieldset>;
	return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">Clipper intake</legend><PayFields activeFields={activeFields} removeField={removeField} /><Slot active={active("platforms")} onRemove={() => removeField("platforms")}><div className="grid gap-2 text-3 font-medium text-gray-11"><span>Platforms</span><div className="flex flex-wrap gap-3">{["TikTok", "Reels", "Shorts"].map((platform) => <label key={platform} className="flex items-center gap-2"><input type="checkbox" name="platforms" value={platform} />{platform}</label>)}</div></div></Slot>{[["creatorName", "Creator / brand name"], ["niche", "Niche"], ["geo", "Geo allowed"], ["languages", "Languages, comma-separated"], ["weeklyCapacity", "Weekly capacity requested"], ["timezone", "Timezone"], ["rateWanted", "Rate wanted"], ["messagingHandle", "Discord or Telegram handle"]].map(([field, label]) => <Slot key={field} active={active(field)} onRemove={() => removeField(field)}><Input label={label} name={field} type={field === "weeklyCapacity" ? "number" : "text"} /></Slot>)}<Slot active={active("rules")} onRemove={() => removeField("rules")}><label className="grid gap-2 text-3 font-medium text-gray-11">Must-follow rules<textarea name="rules" rows={3} className="premium-control p-3 text-3" /></label></Slot><Slot active={active("examples")} onRemove={() => removeField("examples")}><div className="grid gap-3"><Input label="Example clip link 1" name="exampleClipLinks" type="url" /><Input label="Example clip link 2" name="exampleClipLinks" type="url" /><Input label="Example clip link 3" name="exampleClipLinks" type="url" /></div></Slot><Slot active={active("sourceFootage")} onRemove={() => removeField("sourceFootage")}><Input label="Source footage link" name="sourceFootageUrl" type="url" /></Slot><Slot active={active("minAvgViews")} onRemove={() => removeField("minAvgViews")}><Input label="Minimum average views" name="minAvgViews" type="number" /></Slot><Slot active={active("dates")} onRemove={() => removeField("dates")}><div className="grid gap-3 sm:grid-cols-2"><Input label="Start date" name="startDate" type="date" /><Input label="End date" name="endDate" type="date" /></div></Slot><Slot active={active("canStartSameDay")} onRemove={() => removeField("canStartSameDay")}><label className="flex items-center gap-2 text-3 text-gray-11"><input type="checkbox" name="canStartSameDay" /> Can start same day</label></Slot>{removed}</fieldset>;
}
