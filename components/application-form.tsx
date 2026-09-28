"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import type { ApplicationQuestion } from "@/lib/hiring";

export function ApplicationForm({
	roleId,
	questions,
	roleType,
}: {
	roleId: string;
	questions: ApplicationQuestion[];
	roleType: string;
}) {
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");
		const formData = new FormData(event.currentTarget);
		const answers = roleType === "clipper"
			? {
					socialLinks: String(formData.get("socialLinks") || "").trim(),
					clipSamples: Array.from({ length: 3 }, (_, index) => ({ url: String(formData.get(`clipSample${index + 1}`) || "").trim(), views: String(formData.get(`clipViews${index + 1}`) || "").trim() })).filter((sample) => sample.url),
					platforms: formData.getAll("platforms").map(String),
					niche: String(formData.get("niche") || "").trim(),
					languages: String(formData.get("languages") || "").trim(),
					geo: String(formData.get("geo") || "").trim(),
					workMode: String(formData.get("workMode") || "").trim(),
					hoursToPost: String(formData.get("hoursToPost") || "").trim(),
					messagingHandle: String(formData.get("messagingHandle") || "").trim(),
					rateWanted: String(formData.get("rateWanted") || "").trim(),
				}
			: Object.fromEntries(questions.map((question) => [question.id, String(formData.get(question.id) || "").trim()]));
		const response = await fetch("/api/applications", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				roleId,
				applicantEmail: String(formData.get("email") || ""),
				answers,
			}),
		});
		if (!response.ok) {
			setError((await response.json()).error || "Could not submit your application.");
			setSaving(false);
			return;
		}
		setSubmitted(true);
	}

	if (submitted) {
		return (
			<div className="rounded-2xl border border-green-a6 bg-green-a2 p-6 text-center">
					<h2 className="text-6 font-bold text-gray-12">Application received</h2>
					<p className="mt-2 text-4 text-gray-10">Application received. You&apos;ll hear back here.</p>
			</div>
		);
	}

	return (
		<form onSubmit={submit} className="grid gap-5">
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Email address
				<input required type="email" name="email" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" />
			</label>
			{roleType === "clipper" ? <ClipperFields /> : questions.map((question) => (
				<label key={question.id} className="grid gap-2 text-3 font-medium text-gray-11">
					{question.label}
					{question.type === "textarea" ? (
						<textarea required={question.required} name={question.id} rows={4} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" />
					) : (
						<input required={question.required} type={question.type} name={question.id} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" />
					)}
				</label>
			))}
			{error && <p className="text-3 text-red-10">{error}</p>}
			<Button type="submit" variant="classic" size="4" disabled={saving}>
				{saving ? "Applying..." : "Apply to roster"}
			</Button>
		</form>
	);
}

function ClipField({ label, name, required = false, type = "text" }: { label: string; name: string; required?: boolean; type?: string }) {
	return <label className="grid gap-2 text-3 font-medium text-gray-11">{label}<input required={required} type={type} name={name} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" /></label>;
}

function ClipperFields() {
	return <div className="grid gap-5">
		<ClipField label="Social links" name="socialLinks" required />
		<div className="grid gap-3"><p className="text-3 font-medium text-gray-11">2 to 3 best clip URLs with self-reported views</p>{[1, 2, 3].map((index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_160px]"><input required={index < 3} name={`clipSample${index}`} type="url" placeholder={`Clip URL ${index}`} className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12" /><input required={index < 3} name={`clipViews${index}`} type="number" min="0" placeholder="Views" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12" /></div>)}</div>
		<fieldset className="grid gap-2 text-3 font-medium text-gray-11"><legend>Platforms you post on</legend><div className="flex flex-wrap gap-3">{["TikTok", "Reels", "Shorts"].map((platform) => <label key={platform} className="flex items-center gap-2"><input type="checkbox" name="platforms" value={platform} />{platform}</label>)}</div></fieldset>
		<ClipField label="Niche" name="niche" required /><ClipField label="Languages" name="languages" required /><ClipField label="Geo" name="geo" required />
		<label className="grid gap-2 text-3 font-medium text-gray-11">Edit / post / both<select required name="workMode" className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-4 text-gray-12"><option value="edit">Edit</option><option value="post">Post</option><option value="both">Both</option></select></label>
		<ClipField label="Hours you can post" name="hoursToPost" required /><ClipField label="Discord or Telegram handle" name="messagingHandle" required /><ClipField label="Rate wanted" name="rateWanted" required />
	</div>;
}
