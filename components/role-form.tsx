"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@whop/react/components";

export function RoleForm({ workspaceId, companyId, defaultType }: { workspaceId: string; companyId: string; defaultType: string }) {
	const router = useRouter();
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [intakeMode, setIntakeMode] = useState("roster");
	const [roleType, setRoleType] = useState(defaultType);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");
		const response = await fetch("/api/roles", {
			method: "POST",
			body: new FormData(event.currentTarget),
		});
		if (!response.ok) {
			setError((await response.json()).error || "Could not create the role.");
			setSaving(false);
			return;
		}
		const data = await response.json();
		setSaving(false);
		router.push(`/dashboard/${companyId}/roles/${data.roleId}?share=1`);
	}

	return (
		<form onSubmit={submit} className="grid gap-5">
			<input type="hidden" name="workspaceId" value={workspaceId} />
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Title
				<input required name="title" placeholder="Acme: TikTok clipping, Q4" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" />
			</label>
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Role type
				<select required name="type" value={roleType} onChange={(event) => setRoleType(event.target.value)} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12">
					<option value="clipper">Clipper</option><option value="moderator">Moderator</option><option value="va">VA</option><option value="custom">Custom</option>
				</select>
			</label>
			<RoleTypeFields roleType={roleType} />
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Intake mode
				<select name="intakeMode" value={intakeMode} onChange={(event) => setIntakeMode(event.target.value)} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12">
					<option value="roster">Roster — review applicants and add approved people to the bench</option>
					<option value="limited_seats">Limited seats — close applications at the approved seat cap</option>
				</select>
			</label>
			{intakeMode === "limited_seats" && <label className="grid gap-2 text-3 font-medium text-gray-11">Seat cap<input required min="1" type="number" name="seatCap" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12" /></label>}
			<fieldset className="grid gap-2 text-3 font-medium text-gray-11"><legend>Platforms</legend><div className="flex flex-wrap gap-3">{["TikTok", "Reels", "Shorts"].map((platform) => <label key={platform} className="flex items-center gap-2"><input type="checkbox" name="platforms" value={platform} />{platform}</label>)}</div></fieldset>
			<div className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><h3 className="text-4 font-semibold text-gray-12">Display-only pay details</h3><p className="text-2 text-gray-9">Shown to applicants only. Crewcall does not calculate or settle payments.</p><select name="payModel" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12"><option value="">Pay model</option><option value="per_approved_clip">Per approved clip</option><option value="cpm">CPM</option><option value="hybrid">Hybrid</option><option value="hourly">Hourly</option><option value="per_task">Per task</option></select><input name="rateOffered" type="number" min="0" step="0.01" placeholder="Rate offered" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /></div>
			<details><summary className="cursor-pointer text-4 font-semibold text-gray-12">Optional details</summary><div className="mt-4 grid gap-4"><input name="creatorName" placeholder="Creator / brand name" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><input name="niche" placeholder="Niche" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><input name="geo" placeholder="Geo allowed" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><input name="languages" placeholder="Languages, comma-separated" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><textarea name="rules" rows={3} placeholder="Must-follow rules" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><input name="exampleClipLinks" type="url" placeholder="Example clip link 1" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><input name="exampleClipLinks" type="url" placeholder="Example clip link 2" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><input name="exampleClipLinks" type="url" placeholder="Example clip link 3" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><input name="sourceFootageUrl" type="url" placeholder="Source footage link (or leave blank for brief only)" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><input name="minAvgViews" type="number" min="0" placeholder="Minimum average views (reviewer checklist only)" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" />			<div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2">Start date<input name="startDate" type="date" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /></label><label className="grid gap-2">End date<input name="endDate" type="date" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /></label></div></div></details>
			{error && <p className="text-3 text-red-10">{error}</p>}
			<Button type="submit" variant="classic" size="4" disabled={saving}>
				{saving ? "Creating..." : "Create role"}
			</Button>
		</form>
	);
}

function Input({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
	return <label className="grid gap-2 text-3 font-medium text-gray-11">{label}<input name={name} type={type} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12" /></label>;
}

function RoleTypeFields({ roleType }: { roleType: string }) {
	if (roleType === "custom") return <CustomFields />;
	if (roleType === "moderator") return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">Moderator intake</legend><p className="text-3 text-gray-9">Applicants will answer these scenario questions:</p><textarea name="moderatorSpamQuestion" defaultValue="How would you handle spam?" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><textarea name="moderatorRefundQuestion" defaultValue="How would you handle refund rage?" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><textarea name="moderatorPayQuestion" defaultValue="What would you do if a clipper argued about pay?" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><Input label="Hours available" name="moderatorHours" /><Input label="Timezone overlap" name="moderatorTimezone" /><Input label="Languages" name="moderatorLanguages" /><Input label="Tools" name="moderatorTools" /></fieldset>;
	if (roleType === "va") return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">VA intake</legend><Input label="Work sample link" name="vaSample" type="url" /><Input label="Tools" name="vaTools" /><Input label="Hours" name="vaHours" /><Input label="English level" name="vaEnglish" /><Input label="Rate type and amount" name="vaRate" /><label className="flex items-center gap-2 text-3 text-gray-11"><input type="checkbox" name="vaCanFollowSops" /> Can follow SOPs without a call</label></fieldset>;
	return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">Clipper intake</legend><p className="text-3 text-gray-9">Applicants will provide platforms, 2–4 TikTok/Reels/Shorts samples, niche, geo, languages, capacity, timezone, rate wanted, handle, and same-day availability.</p><Input label="Weekly capacity requested" name="clipperWeeklyCapacity" type="number" /><Input label="Timezone" name="clipperTimezone" /><Input label="Rate wanted" name="clipperRate" /></fieldset>;
}

function CustomFields() {
	const [fields, setFields] = useState(["Custom question"]);
	return <fieldset className="grid gap-3 rounded-2xl border border-gray-a5 p-4"><legend className="text-4 font-semibold text-gray-12">Custom intake builder</legend>{fields.map((field, index) => <div key={`${field}-${index}`} className="flex gap-2"><input name="customQuestions" defaultValue={field} className="min-w-0 flex-1 rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" /><button type="button" onClick={() => setFields(fields.filter((_, item) => item !== index))} className="text-3 text-red-10">Remove</button></div>)}<button type="button" onClick={() => setFields([...fields, "Custom question"])} className="text-left text-3 font-semibold text-accent-11">Add field</button></fieldset>;
}
