"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@whop/react/components";
import { currencies } from "@/lib/formatting";

const fieldDefaults: Record<string, string[]> = {
	clipper: ["pay", "platforms", "creatorName", "niche", "geo", "languages", "rules", "examples", "sourceFootage", "minAvgViews", "dates", "weeklyCapacity", "timezone", "rateWanted", "messagingHandle", "canStartSameDay"],
	moderator: ["pay", "moderatorScenarios", "moderatorHours", "moderatorTimezone", "moderatorLanguages", "moderatorTools", "moderatorExperience", "moderatorStyle"],
	va: ["pay", "vaSample", "vaTools", "vaHours", "vaEnglish", "vaWontDo", "vaRate", "vaSops"],
	custom: [],
};

export function RoleForm({ workspaceId, companyId, defaultType }: { workspaceId: string; companyId: string; defaultType: string }) {
	const router = useRouter();
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [intakeMode, setIntakeMode] = useState("roster");
	const [roleType, setRoleType] = useState(defaultType);
	const [activeFields, setActiveFields] = useState(fieldDefaults[defaultType] || []);

	function changeType(type: string) {
		setRoleType(type);
		setActiveFields(fieldDefaults[type] || []);
	}

	function removeField(field: string) {
		setActiveFields((current) => current.filter((item) => item !== field));
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
		<label className="grid gap-2 text-3 font-medium text-gray-11">Intake mode<select name="intakeMode" value={intakeMode} onChange={(event) => setIntakeMode(event.target.value)} className="premium-control p-3 text-4"><option value="roster">Roster — review applicants and add approved people to the bench</option><option value="limited_seats">Limited seats — close applications at the approved seat cap</option></select></label>
		{intakeMode === "limited_seats" && <label className="grid gap-2 text-3 font-medium text-gray-11">Seat cap<input required min="1" type="number" name="seatCap" className="premium-control px-4 py-3 text-4" /></label>}
		<RoleTypeFields roleType={roleType} activeFields={activeFields} removeField={removeField} />
		{error && <p className="text-3 text-red-10">{error}</p>}
		<div className="flex flex-wrap gap-3">
			<Button type="submit" name="saveDraft" value="false" variant="classic" size="4" disabled={saving}>{saving ? "Creating..." : "Create role"}</Button>
			<Button type="submit" name="saveDraft" value="true" variant="classic" size="4" disabled={saving}>{saving ? "Saving..." : "Save draft"}</Button>
		</div>
	</form>;
}

function RemoveField({ onRemove }: { onRemove: () => void }) {
	return <button type="button" onClick={onRemove} aria-label="Remove field" title="Remove field" className="field-remove">×</button>;
}

function Slot({ active, onRemove, children }: { active: boolean; onRemove: () => void; children: React.ReactNode }) {
	if (!active) return null;
	return <div className="relative rounded-xl border border-gray-a4 p-3"><RemoveField onRemove={onRemove} />{children}</div>;
}

function Input({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
	return <label className="grid gap-2 text-3 font-medium text-gray-11">{label}<input name={name} type={type} className="premium-control px-4 py-3 text-4" /></label>;
}

function PayFields({ activeFields, removeField }: { activeFields: string[]; removeField: (field: string) => void }) {
	return <Slot active={activeFields.includes("pay")} onRemove={() => removeField("pay")}><p className="mb-3 text-4 font-semibold text-gray-12">Display-only pay details</p><p className="mb-3 text-2 text-gray-9">Shown to applicants only. Crewcall does not calculate or settle payments.</p><div className="grid gap-3 sm:grid-cols-[1fr_130px]"><select name="payModel" className="premium-control p-3 text-3"><option value="">Pay model</option><option value="cpm">CPM</option><option value="per_clip">Per clip/item</option><option value="flat_fee">Flat fee</option><option value="hourly">Hourly</option><option value="per_task">Per task</option><option value="custom">Custom</option></select><select name="rateCurrency" defaultValue="USD" className="premium-control p-3 text-3">{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}</select></div><input name="rateOffered" type="number" min="0" step="0.01" placeholder="Rate offered" className="premium-control mt-3 px-4 py-3 text-3" /></Slot>;
}

function RoleTypeFields({ roleType, activeFields, removeField }: { roleType: string; activeFields: string[]; removeField: (field: string) => void }) {
	if (roleType === "custom") return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">Custom intake builder</legend><p className="text-3 text-gray-9">Build a blank application template after the role is created.</p></fieldset>;
	if (roleType === "moderator") return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">Moderator intake</legend><PayFields activeFields={activeFields} removeField={removeField} /><Slot active={activeFields.includes("moderatorScenarios")} onRemove={() => removeField("moderatorScenarios")}><p className="mb-2 text-3 font-medium text-gray-11">Scenario questions</p><textarea name="moderatorSpamQuestion" defaultValue="How would you handle spam?" className="premium-control mb-2 p-3 text-3" /><textarea name="moderatorRefundQuestion" defaultValue="How would you handle refund rage?" className="premium-control mb-2 p-3 text-3" /><textarea name="moderatorPayQuestion" defaultValue="What would you do if a clipper argued about pay?" className="premium-control p-3 text-3" /></Slot><Slot active={activeFields.includes("moderatorHours")} onRemove={() => removeField("moderatorHours")}><Input label="Hours available" name="moderatorHours" /></Slot><Slot active={activeFields.includes("moderatorTimezone")} onRemove={() => removeField("moderatorTimezone")}><Input label="Timezone overlap" name="moderatorTimezone" /></Slot><Slot active={activeFields.includes("moderatorLanguages")} onRemove={() => removeField("moderatorLanguages")}><Input label="Languages" name="moderatorLanguages" /></Slot><Slot active={activeFields.includes("moderatorTools")} onRemove={() => removeField("moderatorTools")}><Input label="Tools" name="moderatorTools" /></Slot><Slot active={activeFields.includes("moderatorExperience")} onRemove={() => removeField("moderatorExperience")}><Input label="Prior ban / mute experience" name="moderatorExperience" /></Slot><Slot active={activeFields.includes("moderatorStyle")} onRemove={() => removeField("moderatorStyle")}><Input label="Script or improvise" name="moderatorStyle" /></Slot></fieldset>;
	if (roleType === "va") return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">VA intake</legend><PayFields activeFields={activeFields} removeField={removeField} /><Slot active={activeFields.includes("vaSample")} onRemove={() => removeField("vaSample")}><Input label="Work sample link" name="vaSample" type="url" /></Slot><Slot active={activeFields.includes("vaTools")} onRemove={() => removeField("vaTools")}><Input label="Tools" name="vaTools" /></Slot><Slot active={activeFields.includes("vaHours")} onRemove={() => removeField("vaHours")}><Input label="Hours" name="vaHours" /></Slot><Slot active={activeFields.includes("vaEnglish")} onRemove={() => removeField("vaEnglish")}><Input label="English level" name="vaEnglish" /></Slot><Slot active={activeFields.includes("vaWontDo")} onRemove={() => removeField("vaWontDo")}><label className="grid gap-2 text-3 font-medium text-gray-11">What they won&apos;t do<textarea name="vaWontDo" className="premium-control p-3 text-3" /></label></Slot><Slot active={activeFields.includes("vaRate")} onRemove={() => removeField("vaRate")}><Input label="Rate type and amount" name="vaRate" /></Slot><Slot active={activeFields.includes("vaSops")} onRemove={() => removeField("vaSops")}><label className="flex items-center gap-2 text-3 text-gray-11"><input type="checkbox" name="vaCanFollowSops" /> Can follow SOPs without a call</label></Slot></fieldset>;
	return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">Clipper intake</legend><PayFields activeFields={activeFields} removeField={removeField} /><Slot active={activeFields.includes("platforms")} onRemove={() => removeField("platforms")}><div className="grid gap-2 text-3 font-medium text-gray-11"><span>Platforms</span><div className="flex flex-wrap gap-3">{["TikTok", "Reels", "Shorts"].map((platform) => <label key={platform} className="flex items-center gap-2"><input type="checkbox" name="platforms" value={platform} />{platform}</label>)}</div></div></Slot><Slot active={activeFields.includes("creatorName")} onRemove={() => removeField("creatorName")}><Input label="Creator / brand name" name="creatorName" /></Slot><Slot active={activeFields.includes("niche")} onRemove={() => removeField("niche")}><Input label="Niche" name="niche" /></Slot><Slot active={activeFields.includes("geo")} onRemove={() => removeField("geo")}><Input label="Geo allowed" name="geo" /></Slot><Slot active={activeFields.includes("languages")} onRemove={() => removeField("languages")}><Input label="Languages, comma-separated" name="languages" /></Slot><Slot active={activeFields.includes("rules")} onRemove={() => removeField("rules")}><label className="grid gap-2 text-3 font-medium text-gray-11">Must-follow rules<textarea name="rules" rows={3} className="premium-control p-3 text-3" /></label></Slot><Slot active={activeFields.includes("examples")} onRemove={() => removeField("examples")}><div className="grid gap-3"><Input label="Example clip link 1" name="exampleClipLinks" type="url" /><Input label="Example clip link 2" name="exampleClipLinks" type="url" /><Input label="Example clip link 3" name="exampleClipLinks" type="url" /></div></Slot><Slot active={activeFields.includes("sourceFootage")} onRemove={() => removeField("sourceFootage")}><Input label="Source footage link" name="sourceFootageUrl" type="url" /></Slot><Slot active={activeFields.includes("minAvgViews")} onRemove={() => removeField("minAvgViews")}><Input label="Minimum average views" name="minAvgViews" type="number" /></Slot><Slot active={activeFields.includes("dates")} onRemove={() => removeField("dates")}><div className="grid gap-3 sm:grid-cols-2"><Input label="Start date" name="startDate" type="date" /><Input label="End date" name="endDate" type="date" /></div></Slot><Slot active={activeFields.includes("weeklyCapacity")} onRemove={() => removeField("weeklyCapacity")}><Input label="Weekly capacity requested" name="clipperWeeklyCapacity" type="number" /></Slot><Slot active={activeFields.includes("timezone")} onRemove={() => removeField("timezone")}><Input label="Timezone" name="clipperTimezone" /></Slot><Slot active={activeFields.includes("rateWanted")} onRemove={() => removeField("rateWanted")}><Input label="Rate wanted" name="clipperRate" /></Slot><Slot active={activeFields.includes("messagingHandle")} onRemove={() => removeField("messagingHandle")}><Input label="Discord or Telegram handle" name="messagingHandle" /></Slot><Slot active={activeFields.includes("canStartSameDay")} onRemove={() => removeField("canStartSameDay")}><label className="flex items-center gap-2 text-3 text-gray-11"><input type="checkbox" name="canStartSameDay" /> Can start same day</label></Slot></fieldset>;
}
