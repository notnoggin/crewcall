"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import { hiringTypeLabels, hiringTypes, type HiringType } from "@/lib/hiring";

export function OnboardingForm({ companyId }: { companyId: string }) {
	const [hiringType, setHiringType] = useState<HiringType>("clipper");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");
		const response = await fetch("/api/workspaces/onboard", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ companyId, hiringType }),
		});

		if (!response.ok) {
			setError((await response.json()).error || "Could not save your setup.");
			setSaving(false);
			return;
		}

		window.location.reload();
	}

	return (
		<form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-8">
			<div>
				<p className="mb-3 text-2 font-semibold uppercase tracking-[0.2em] text-gray-9">
					Welcome to Crewcall
				</p>
				<h1 className="text-8 font-bold text-gray-12">What are you hiring for?</h1>
				<p className="mt-3 text-4 text-gray-10">
					We&apos;ll tailor your first application template to get you moving.
				</p>
			</div>
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
			{error && <p className="text-3 text-red-10">{error}</p>}
			<Button type="submit" variant="classic" size="4" disabled={saving}>
				{saving ? "Setting up..." : "Continue"}
			</Button>
		</form>
	);
}
