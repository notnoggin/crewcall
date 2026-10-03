"use client";

import { useEffect, useState } from "react";
import { Button } from "@whop/react/components";
import type { ApplicationQuestion } from "@/lib/hiring";
import { clipPlatformMessage, isClipUrlForPlatforms } from "@/lib/application-fields";
import { supportEmail } from "@/lib/support";
import { currencies, parseViewCount } from "@/lib/formatting";

export function ApplicationForm({ roleId, questions, roleType, activeFields = [], platforms = [] }: { roleId: string; questions: ApplicationQuestion[]; roleType: string; activeFields?: string[]; platforms?: string[] }) {
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [statusUrl, setStatusUrl] = useState("");
	const [email, setEmail] = useState("");
	const [recovering, setRecovering] = useState(false);

	useEffect(() => {
		const storedStatusUrl = window.localStorage.getItem(`crewcall-application-status:${roleId}`);
		if (storedStatusUrl) window.location.replace(storedStatusUrl);
	}, [roleId]);

	async function recoverStatus() {
		if (!email.trim()) {
			setError("Enter the email you applied with.");
			return;
		}
		setRecovering(true);
		setError("");
		const response = await fetch("/api/applications/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roleId, email }) });
		const data = await response.json();
		setRecovering(false);
		if (!response.ok) {
			setError(data.error || "No application was found for that email.");
			return;
		}
		window.location.replace(data.statusUrl);
	}

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");
		const formData = new FormData(event.currentTarget);
		const clipUrls = formData.getAll("clipSample").map(String).map((value) => value.trim()).filter(Boolean);
		if (roleType === "clipper" && (!activeFields.length || activeFields.includes("clipSamples")) && (clipUrls.length < 2 || clipUrls.length > 4 || clipUrls.some((url) => !isClipUrlForPlatforms(url, platforms)))) {
			setError(platforms.length ? clipPlatformMessage(platforms) : "Add 2 to 4 valid clip links.");
			setSaving(false);
			return;
		}
		if (roleType === "clipper" && (!activeFields.length || activeFields.includes("clipSamples"))) {
			const invalidView = clipUrls.some((_, index) => {
				const value = String(formData.get(`clipViews${index + 1}`) || "").trim();
				return Boolean(value) && parseViewCount(value) === null;
			});
			if (invalidView) {
				setError("Views must be a number or shorthand such as 112k or 1.6M.");
				setSaving(false);
				return;
			}
		}
		const answers = roleType === "clipper"
			? {
					socialLinks: String(formData.get("socialLinks") || "").trim(),
					clipSamples: clipUrls.map((url, index) => ({ url, views: parseViewCount(String(formData.get(`clipViews${index + 1}`) || "").trim()) })),
					niche: String(formData.get("niche") || "").trim(),
					languages: String(formData.get("languages") || "").trim(),
					geo: String(formData.get("geo") || "").trim(),
					workMode: String(formData.get("workMode") || "").trim(),
					weeklyCapacity: String(formData.get("weeklyCapacity") || "").trim(),
					timezone: String(formData.get("timezone") || "").trim(),
					messagingHandle: String(formData.get("messagingHandle") || "").trim(),
					rateWanted: String(formData.get("rateWanted") || "").trim(),
					rateCurrency: String(formData.get("rateCurrency") || "USD"),
					canStartSameDay: formData.get("canStartSameDay") === "on",
				}
			: roleType === "moderator"
				? {
						...Object.fromEntries(questions.map((question) => [question.id, String(formData.get(question.id) || "").trim()])),
						hoursAvailable: String(formData.get("hoursAvailable") || "").trim(),
						timezoneOverlap: String(formData.get("timezoneOverlap") || "").trim(),
						languages: String(formData.get("languages") || "").trim(),
						tools: String(formData.get("tools") || "").trim(),
						banMuteExperience: String(formData.get("banMuteExperience") || "").trim(),
						scriptOrImprovise: String(formData.get("scriptOrImprovise") || "").trim(),
					}
				: {
						...Object.fromEntries(questions.map((question) => [question.id, String(formData.get(question.id) || "").trim()])),
						workSample: String(formData.get("workSample") || "").trim(),
						tools: String(formData.get("tools") || "").trim(),
						hours: String(formData.get("hours") || "").trim(),
						timezone: String(formData.get("timezone") || "").trim(),
						englishLevel: String(formData.get("englishLevel") || "").trim(),
						wontDo: String(formData.get("wontDo") || "").trim(),
						rateTypeAmount: String(formData.get("rateTypeAmount") || "").trim(),
						canFollowSops: formData.get("canFollowSops") === "on",
					};
		const response = await fetch("/api/applications", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ roleId, applicantEmail: String(formData.get("email") || ""), answers }),
		});
		if (!response.ok) {
			const result = await response.json();
			if (result.alreadyApplied && result.statusUrl) {
				window.localStorage.setItem(`crewcall-application-status:${roleId}`, result.statusUrl);
				setError("You already applied for this role. Use your existing status page:");
				setStatusUrl(result.statusUrl);
			} else {
				setError(result.error || "Could not submit your application.");
			}
			setSaving(false);
			return;
		}
		const data = await response.json();
		setStatusUrl(data.statusUrl || "");
		if (data.statusUrl) window.localStorage.setItem(`crewcall-application-status:${roleId}`, data.statusUrl);
		setSubmitted(true);
		setSaving(false);
	}

	if (submitted) return <div className="rounded-2xl border border-green-a6 bg-green-a2 p-6 text-center"><h2 className="text-6 font-bold text-gray-12">Application received</h2><p className="mt-2 text-4 text-gray-10">Your permanent status link was emailed to you.</p>{statusUrl && <p className="mt-4"><a href={statusUrl} className="text-accent-11">View application status</a></p>}<p className="mt-4 text-3 text-gray-10">Having an issue? <a href={`mailto:${supportEmail}`} className="text-accent-11">Contact support</a></p></div>;

	return <form onSubmit={submit} className="grid gap-6">
		<div className="border-b border-gray-a4 pb-5"><p className="text-5 font-semibold tracking-tight text-gray-12">Tell us about you</p><p className="mt-1 text-3 text-gray-9">A few focused questions, then we&apos;ll take it from here.</p></div>
		<label className="grid gap-2 text-3 font-medium text-gray-11">Email address *<input required type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} className="premium-control px-4 py-3 text-4" /><span className="text-3 font-normal text-gray-9">We&apos;ll email your permanent application status link.</span><button type="button" onClick={recoverStatus} disabled={recovering} className="justify-self-start border-0 bg-transparent !p-0 text-3 font-semibold text-accent-11 !shadow-none">{recovering ? "Checking..." : "Already applied? View your status"}</button></label>
		{roleType === "clipper" ? <ClipperFields activeFields={activeFields} platforms={platforms} /> : roleType === "moderator" ? <ModeratorFields questions={questions} activeFields={activeFields} /> : roleType === "va" ? <VaFields questions={questions} activeFields={activeFields} /> : <QuestionFields questions={questions} />}
		{error && <p className="text-3 text-red-10">{error} {statusUrl && <a href={statusUrl} className="text-accent-11">Open status page</a>}</p>}
		<Button type="submit" variant="classic" size="4" disabled={saving}>{saving ? "Applying..." : "Apply to bench"}</Button>
	</form>;
}

function Field({ label, name, type = "text", required = false, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
	return <label className="grid gap-2 text-3 font-medium text-gray-11">{label}{required && <span className="ml-1 text-gray-9">*</span>}<input required={required} type={type} name={name} placeholder={placeholder} className="premium-control px-4 py-3 text-4" /></label>;
}

function Area({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
	return <label className="grid gap-2 text-3 font-medium text-gray-11">{label}{required && <span className="ml-1 text-gray-9">*</span>}<textarea required={required} name={name} rows={3} className="premium-control min-h-28 p-3 text-4" /></label>;
}

function QuestionFields({ questions }: { questions: ApplicationQuestion[] }) {
	return <>{questions.map((question) => question.type === "textarea" ? <Area key={question.id} label={question.label} name={question.id} required={question.required} /> : <Field key={question.id} label={question.label} name={question.id} type={question.type} required={question.required} />)}</>;
}

function ClipperFields({ activeFields, platforms }: { activeFields: string[]; platforms: string[] }) {
	const active = (field: string) => !activeFields.length || activeFields.includes(field);
	return <div className="grid gap-5">
		{active("socialLinks") && <Field label="Social links" name="socialLinks" required />}
		{active("clipSamples") && <div className="grid gap-3"><p className="text-3 font-medium text-gray-11">2 to 4 best clip links with self-reported views</p>{[1, 2, 3, 4].map((index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_160px]"><input required={index <= 2} name="clipSample" type="url" placeholder={`TikTok, Reels, or Shorts link ${index}`} className="premium-control px-4 py-3 text-4" /><input name={`clipViews${index}`} placeholder="Views (112k, 1.6M)" className="premium-control px-4 py-3 text-4" /></div>)}</div>}
		{platforms.length > 0 && <p className="text-3 text-gray-9">Accepted sample platforms: {platforms.join(", ")}.</p>}
		{active("niche") && <Field label="Niche" name="niche" required />}{active("languages") && <Field label="Languages" name="languages" required />}{active("geo") && <Field label="Geo" name="geo" required />}
		{active("workMode") && <label className="grid gap-2 text-3 font-medium text-gray-11">Edit / post / both<select required name="workMode" className="premium-control p-3 text-4"><option value="edit">Edit</option><option value="post">Post</option><option value="both">Both</option></select></label>}
		{active("weeklyCapacity") && <Field label="Weekly capacity" name="weeklyCapacity" type="number" required />}{active("timezone") && <Field label="Timezone" name="timezone" required />}{active("messagingHandle") && <Field label="Discord or Telegram handle" name="messagingHandle" required />}{active("rateWanted") && <div className="grid gap-2"><span className="text-3 font-medium text-gray-11">Rate wanted</span><div className="grid gap-3 sm:grid-cols-[130px_1fr]"><select name="rateCurrency" className="premium-control p-3 text-4">{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}</select><input name="rateWanted" required className="premium-control px-4 py-3 text-4" /></div></div>}{active("canStartSameDay") && <label className="flex items-center gap-2 text-3 text-gray-11"><input type="checkbox" name="canStartSameDay" /> Can start same day</label>}
	</div>;
}

function ModeratorFields({ questions, activeFields }: { questions: ApplicationQuestion[]; activeFields: string[] }) {
	const active = (field: string) => !activeFields.length || activeFields.includes(field);
	return <div className="grid gap-5">{active("moderatorScenarios") && <QuestionFields questions={questions} />}{active("moderatorHours") && <Field label="Hours available" name="hoursAvailable" required />}{active("moderatorTimezone") && <Field label="Timezone overlap" name="timezoneOverlap" required />}{active("moderatorLanguages") && <Field label="Languages" name="languages" required />}{active("moderatorTools") && <Field label="Tools (Discord, Whop chat, Telegram)" name="tools" required />}{active("moderatorExperience") && <Area label="Prior ban / mute experience" name="banMuteExperience" required />}{active("moderatorStyle") && <label className="grid gap-2 text-3 font-medium text-gray-11">Script or improvise<select name="scriptOrImprovise" className="premium-control p-3 text-4"><option>Script</option><option>Improvise</option><option>Both</option></select></label>}</div>;
}

function VaFields({ questions, activeFields }: { questions: ApplicationQuestion[]; activeFields: string[] }) {
	const active = (field: string) => !activeFields.length || activeFields.includes(field);
	return <div className="grid gap-5">{active("vaSample") && <Field label="Work sample link (cut, sheet, or SOP)" name="workSample" type="url" required />}{active("vaTools") && <Field label="Tools" name="tools" required />}{active("vaHours") && <Field label="Hours" name="hours" required />}{active("vaTimezone") && <Field label="Timezone" name="timezone" required />}{active("vaEnglish") && <Field label="English level" name="englishLevel" required />}{active("vaWontDo") && <Area label="What you won&apos;t do" name="wontDo" required />}{active("vaRate") && <Field label="Rate type and amount" name="rateTypeAmount" required />}{active("vaSops") && <label className="flex items-center gap-2 text-3 text-gray-11"><input type="checkbox" name="canFollowSops" required /> Can follow SOPs without a call</label>}{questions.length > 0 && <QuestionFields questions={questions} />}</div>;
}
