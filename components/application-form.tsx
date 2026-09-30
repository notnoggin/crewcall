"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import type { ApplicationQuestion } from "@/lib/hiring";
import { isSupportedClipUrl } from "@/lib/application-fields";
import { supportEmail } from "@/lib/support";

export function ApplicationForm({ roleId, questions, roleType }: { roleId: string; questions: ApplicationQuestion[]; roleType: string }) {
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [statusUrl, setStatusUrl] = useState("");

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");
		const formData = new FormData(event.currentTarget);
		const clipUrls = formData.getAll("clipSample").map(String).map((value) => value.trim()).filter(Boolean);
		if (roleType === "clipper" && (clipUrls.length < 2 || clipUrls.length > 4 || clipUrls.some((url) => !isSupportedClipUrl(url)))) {
			setError("Add 2 to 4 valid TikTok, Instagram Reels, or YouTube Shorts links.");
			setSaving(false);
			return;
		}
		const answers = roleType === "clipper"
			? {
					socialLinks: String(formData.get("socialLinks") || "").trim(),
					clipSamples: clipUrls.map((url, index) => ({ url, views: String(formData.get(`clipViews${index + 1}`) || "").trim() })),
					platforms: formData.getAll("platforms").map(String),
					niche: String(formData.get("niche") || "").trim(),
					languages: String(formData.get("languages") || "").trim(),
					geo: String(formData.get("geo") || "").trim(),
					workMode: String(formData.get("workMode") || "").trim(),
					weeklyCapacity: String(formData.get("weeklyCapacity") || "").trim(),
					timezone: String(formData.get("timezone") || "").trim(),
					messagingHandle: String(formData.get("messagingHandle") || "").trim(),
					rateWanted: String(formData.get("rateWanted") || "").trim(),
					canStartSameDay: formData.get("canStartSameDay") === "on",
				}
			: Object.fromEntries(questions.map((question) => [question.id, String(formData.get(question.id) || "").trim()]));
		const response = await fetch("/api/applications", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ roleId, applicantEmail: String(formData.get("email") || ""), answers }),
		});
		if (!response.ok) {
			setError((await response.json()).error || "Could not submit your application.");
			setSaving(false);
			return;
		}
		const data = await response.json();
		setStatusUrl(data.statusUrl || "");
		setSubmitted(true);
		setSaving(false);
	}

	if (submitted) return <div className="rounded-2xl border border-green-a6 bg-green-a2 p-6 text-center"><h2 className="text-6 font-bold text-gray-12">Application received</h2><p className="mt-2 text-4 text-gray-10">Application received. You&apos;ll hear back here.</p>{statusUrl && <p className="mt-4"><a href={statusUrl} className="text-accent-11 underline">View application status</a></p>}<p className="mt-4 text-3 text-gray-10">Having an issue? <a href={`mailto:${supportEmail}`} className="text-accent-11 underline">Contact support</a></p></div>;

	return <form onSubmit={submit} className="grid gap-5">
		<Field label="Email address" name="email" type="email" required />
		{roleType === "clipper" ? <ClipperFields /> : roleType === "moderator" ? <ModeratorFields questions={questions} /> : roleType === "va" ? <VaFields questions={questions} /> : <QuestionFields questions={questions} />}
		{error && <p className="text-3 text-red-10">{error}</p>}
		<Button type="submit" variant="classic" size="4" disabled={saving}>{saving ? "Applying..." : "Apply to roster"}</Button>
	</form>;
}

function Field({ label, name, type = "text", required = false, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
	return <label className="grid gap-2 text-3 font-medium text-gray-11">{label}<input required={required} type={type} name={name} placeholder={placeholder} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" /></label>;
}

function Area({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
	return <label className="grid gap-2 text-3 font-medium text-gray-11">{label}<textarea required={required} name={name} rows={3} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" /></label>;
}

function QuestionFields({ questions }: { questions: ApplicationQuestion[] }) {
	return <>{questions.map((question) => question.type === "textarea" ? <Area key={question.id} label={question.label} name={question.id} required={question.required} /> : <Field key={question.id} label={question.label} name={question.id} type={question.type} required={question.required} />)}</>;
}

function ClipperFields() {
	return <div className="grid gap-5">
		<Field label="Social links" name="socialLinks" required />
		<div className="grid gap-3"><p className="text-3 font-medium text-gray-11">2 to 4 best clip links with self-reported views</p>{[1, 2, 3, 4].map((index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_160px]"><input required={index <= 2} name="clipSample" type="url" placeholder={`TikTok, Reels, or Shorts link ${index}`} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12" /><input name={`clipViews${index}`} type="number" min="0" placeholder="Views" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12" /></div>)}</div>
		<fieldset className="grid gap-2 text-3 font-medium text-gray-11"><legend>Platforms</legend><div className="flex flex-wrap gap-3">{["TikTok", "Reels", "Shorts"].map((item) => <label key={item} className="flex items-center gap-2"><input type="checkbox" name="platforms" value={item} />{item}</label>)}</div></fieldset>
		<Field label="Niche" name="niche" required /><Field label="Languages" name="languages" required /><Field label="Geo" name="geo" required />
		<label className="grid gap-2 text-3 font-medium text-gray-11">Edit / post / both<select required name="workMode" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-4 text-gray-12"><option value="edit">Edit</option><option value="post">Post</option><option value="both">Both</option></select></label>
		<Field label="Weekly capacity" name="weeklyCapacity" type="number" required /><Field label="Timezone" name="timezone" required /><Field label="Discord or Telegram handle" name="messagingHandle" required /><Field label="Rate wanted" name="rateWanted" required /><label className="flex items-center gap-2 text-3 text-gray-11"><input type="checkbox" name="canStartSameDay" /> Can start same day</label>
	</div>;
}

function ModeratorFields({ questions }: { questions: ApplicationQuestion[] }) {
	return <div className="grid gap-5"><QuestionFields questions={questions} /><Field label="Hours available" name="hoursAvailable" required /><Field label="Timezone overlap" name="timezoneOverlap" required /><Field label="Languages" name="languages" required /><Field label="Tools (Discord, Whop chat, Telegram)" name="tools" required /><Area label="Prior ban / mute experience" name="banMuteExperience" required /><label className="grid gap-2 text-3 font-medium text-gray-11">Script or improvise<select name="scriptOrImprovise" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-4 text-gray-12"><option>Script</option><option>Improvise</option><option>Both</option></select></label></div>;
}

function VaFields({ questions }: { questions: ApplicationQuestion[] }) {
	return <div className="grid gap-5"><QuestionFields questions={questions} /><Field label="Work sample link (cut, sheet, or SOP)" name="workSample" type="url" required /><Field label="Tools" name="tools" required /><Field label="Hours" name="hours" required /><Field label="English level" name="englishLevel" required /><Area label="What you won&apos;t do" name="wontDo" required /><Field label="Rate type and amount" name="rateTypeAmount" required /><label className="flex items-center gap-2 text-3 text-gray-11"><input type="checkbox" name="canFollowSops" required /> Can follow SOPs without a call</label></div>;
}
