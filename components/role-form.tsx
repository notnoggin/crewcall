"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";

export function RoleForm({ workspaceId }: { workspaceId: string }) {
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

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
		window.location.reload();
	}

	return (
		<form onSubmit={submit} className="grid gap-5">
			<input type="hidden" name="workspaceId" value={workspaceId} />
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Role title
				<input required name="title" placeholder="e.g. Short-form Video Editor" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" />
			</label>
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Role type
				<input required name="type" placeholder="e.g. Clipper" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" />
			</label>
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Description
				<textarea name="description" rows={4} placeholder="What will this person own?" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" />
			</label>
			<label className="grid gap-2 text-3 font-medium text-gray-11">
				Number of hires
				<input required min="1" type="number" name="capacity" defaultValue="1" className="rounded-xl border border-gray-a5 bg-gray-a2 px-4 py-3 text-4 text-gray-12 outline-none focus:border-accent-9" />
			</label>
			{error && <p className="text-3 text-red-10">{error}</p>}
			<Button type="submit" variant="classic" size="4" disabled={saving}>
				{saving ? "Creating..." : "Create role"}
			</Button>
		</form>
	);
}
