"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import { hiringTypeLabels, hiringTypes, type HiringType } from "@/lib/hiring";

const STARTER_OPTIONS = [
	{ count: 0, label: "No starter roles", hint: "Start blank" },
	{ count: 1, label: "1 draft role", hint: "Recommended" },
	{ count: 2, label: "2 draft roles", hint: "Two pipelines" },
] as const;

const HIRING_HINTS: Record<HiringType, string> = {
	clipper: "A ready-to-use clipping application flow",
	moderator: "A ready-to-use moderation application flow",
	va: "A ready-to-use VA application flow",
	custom: "Start with a blank role template",
};

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
		<div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)] lg:items-start">
			<div className="grid gap-4">
				<div className="premium-surface p-6 sm:p-8">
					<p className="page-kicker">Welcome to Crewcall</p>
					<h1 className="page-title">What are you hiring for?</h1>
					<p className="page-subtitle">
						We&apos;ll tailor your first application template to get you moving.
					</p>
				</div>
				<div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-1">
					<OnboardingPreview
						image="/onboarding-home.svg"
						alt="Crewcall home dashboard"
						title="Your whole hiring desk, in one glance."
					/>
					<OnboardingPreview
						image="/onboarding-bench.svg"
						alt="Crewcall bench dashboard"
						title="Your ready-to-work crew, always on standby."
					/>
				</div>
			</div>

			<form onSubmit={submit} className="flex flex-col gap-7 premium-surface p-6 sm:p-8">
				<label className="grid gap-2 text-3 font-medium text-gray-11">
					Workspace name
					<input
						required
						value={workspaceName}
						onChange={(event) => setWorkspaceName(event.target.value)}
						placeholder="e.g. Acme Media"
						autoComplete="organization"
						className="premium-control px-4 py-3 text-4"
					/>
					<span className="text-3 font-normal text-gray-9">
						This appears in your share links and applicant-facing pages.
					</span>
				</label>

				<div className="grid gap-3">
					<p className="text-3 font-medium text-gray-11">Role template</p>
					<div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Role template">
						{hiringTypes.map((type) => {
							const selected = hiringType === type;
							return (
								<button
									key={type}
									type="button"
									role="radio"
									aria-checked={selected}
									onClick={() => setHiringType(type)}
									className={`onboarding-choice text-left ${
										selected ? "onboarding-choice-selected" : ""
									}`}
								>
									<span className="onboarding-choice-radio" aria-hidden="true">
										{selected ? <span className="onboarding-choice-radio-dot" /> : null}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-4 font-semibold text-gray-12">
											{hiringTypeLabels[type]}
										</span>
										<span className="mt-0.5 block text-3 font-normal text-gray-10">
											{HIRING_HINTS[type]}
										</span>
									</span>
								</button>
							);
						})}
					</div>
				</div>

				<div className="grid gap-3">
					<div>
						<p className="text-3 font-medium text-gray-11">Start with a role template</p>
						<p className="mt-1 text-3 text-gray-10">
							Create draft roles now. You can edit, publish, or delete them later.
						</p>
					</div>
					<div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Starter roles">
						{STARTER_OPTIONS.map(({ count, label, hint }) => {
							const selected = starterRoles === count;
							return (
								<button
									key={count}
									type="button"
									role="radio"
									aria-checked={selected}
									onClick={() => setStarterRoles(count)}
									className={`onboarding-choice onboarding-choice-compact text-left ${
										selected ? "onboarding-choice-selected" : ""
									}`}
								>
									<span className="block text-3 font-semibold text-gray-12">{label}</span>
									<span className="mt-0.5 block text-2 font-normal text-gray-9">{hint}</span>
								</button>
							);
						})}
					</div>
				</div>

				{error ? <p className="text-3 text-red-10">{error}</p> : null}

				<Button type="submit" variant="classic" size="4" disabled={saving}>
					{saving ? "Setting up..." : "Continue"}
				</Button>
			</form>
		</div>
	);
}

function OnboardingPreview({
	image,
	alt,
	title,
}: {
	image: string;
	alt: string;
	title: string;
}) {
	return (
		<figure className="premium-surface overflow-hidden p-3">
			<img
				src={image}
				alt={alt}
				className="aspect-[16/9] w-full rounded-xl border border-gray-a4 object-cover object-top"
			/>
			<figcaption className="px-2 pb-1 pt-3 text-3 font-medium text-gray-11">{title}</figcaption>
		</figure>
	);
}
