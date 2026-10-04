"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import { hiringTypeLabels, hiringTypes, type HiringType } from "@/lib/hiring";

export function OnboardingForm({ companyId }: { companyId: string }) {
	const [hiringType, setHiringType] = useState<HiringType>("clipper");
	const [workspaceName, setWorkspaceName] = useState("");
	const [starterRoles, setStarterRoles] = useState(1);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");

		try {
			const response = await fetch("/api/workspaces/onboard", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ companyId, workspaceName, hiringType, starterRoles }),
			});
			const result = (await response.json()) as { error?: string };

			if (!response.ok) {
				throw new Error(result.error || `Onboarding request failed with HTTP ${response.status}.`);
			}

			window.location.reload();
		} catch (submitError) {
			console.error("Crewcall onboarding failed:", submitError);
			setError(
				submitError instanceof Error
					? submitError.message
					: "Could not save your setup. Check the server logs for the onboarding error.",
			);
			setSaving(false);
		}
	}

	return (
		<div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)] lg:items-start">
			<div className="grid gap-4">
				<div className="premium-surface p-6 sm:p-8">
					<p className="page-kicker">Welcome to Crewcall</p>
					<h1 className="page-title">What are you hiring for?</h1>
					<p className="page-subtitle">We&apos;ll tailor your first application template to get you moving.</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
					<OnboardingPreview image="/onboarding-home.png" alt="Crewcall home dashboard" title="See the whole hiring desk at a glance." />
					<OnboardingPreview image="/onboarding-bench.png" alt="Crewcall bench dashboard" title="Keep approved people ready for the next campaign." />
				</div>
			</div>
			<form onSubmit={submit} className="flex flex-col gap-8 premium-surface p-6 sm:p-8">
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Workspace name
				<input required value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="e.g. Acme Media" className="premium-control px-4 py-3 text-4" />
				<span className="text-3 font-normal text-gray-9">This appears in your share links and applicant-facing pages.</span>
			</label>
			<div className="grid gap-3 sm:grid-cols-2">
				{hiringTypes.map((type) => (
					<button
						key={type}
						type="button"
						onClick={() => setHiringType(type)}
						className={`rounded-2xl border p-5 text-left transition ${
							hiringType === type
								? "border-accent-9 bg-accent-a3"
								: "border-gray-a5 bg-gray-a2 hover:bg-gray-a3"
						}`}
					>
						<strong className="text-5 text-gray-12">{hiringTypeLabels[type]}</strong>
						<span className="mt-1 block text-3 text-gray-10">
							{type === "custom" ? "Start with a blank role template" : `A ready-to-use ${hiringTypeLabels[type].toLowerCase()} flow`}
						</span>
					</button>
				))}
			</div>
			<fieldset className="grid gap-3 rounded-2xl border border-gray-a5 bg-gray-a2 p-5">
				<legend className="text-4 font-semibold text-gray-12">Start with a role template</legend>
				<p className="text-3 text-gray-10">Create one or two draft roles now. You can edit, publish, or delete them later.</p>
				<div className="flex flex-wrap gap-2">
					{[0, 1, 2].map((count) => <button key={count} type="button" onClick={() => setStarterRoles(count)} className={`rounded-xl border px-4 py-2 text-3 font-semibold ${starterRoles === count ? "border-accent-9 bg-accent-a3 text-gray-12" : "border-gray-a5 text-gray-10"}`}>{count === 0 ? "No starter roles" : `${count} draft role${count === 1 ? "" : "s"}`}</button>)}
				</div>
			</fieldset>
			{error && <p className="text-3 text-red-10">{error}</p>}
			<Button type="submit" variant="classic" size="4" disabled={saving}>
				{saving ? "Setting up..." : "Continue"}
			</Button>
			</form>
		</div>
	);
}

function OnboardingPreview({ image, alt, title }: { image: string; alt: string; title: string }) {
	return <figure className="premium-surface overflow-hidden p-3"><img src={image} alt={alt} className="aspect-[16/9] w-full rounded-xl border border-gray-a4 object-cover object-top" /><figcaption className="px-2 pb-1 pt-3 text-3 font-medium text-gray-11">{title}</figcaption></figure>;
}
