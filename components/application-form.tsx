"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";
import type { ApplicationQuestion } from "@/lib/hiring";

export function ApplicationForm({
	roleId,
	questions,
}: {
	roleId: string;
	questions: ApplicationQuestion[];
}) {
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");
		const formData = new FormData(event.currentTarget);
		const answers = Object.fromEntries(
			questions.map((question) => [question.id, String(formData.get(question.id) || "").trim()]),
		);
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
				<p className="mt-2 text-4 text-gray-10">Thanks for applying. We&apos;ll be in touch soon.</p>
			</div>
		);
	}

	return (
		<form onSubmit={submit} className="grid gap-5">
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Email address
				<input required type="email" name="email" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" />
			</label>
			{questions.map((question) => (
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
				{saving ? "Submitting..." : "Submit application"}
			</Button>
		</form>
	);
}
