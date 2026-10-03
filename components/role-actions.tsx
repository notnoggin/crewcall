"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@whop/react/components";

export function RoleActions({ roleId, title, status, rolesPath }: { roleId: string; title: string; status: string; rolesPath: string }) {
	const router = useRouter();
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);

	async function action(method: "PATCH" | "DELETE", actionName?: string) {
		if (method === "DELETE" && !window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
		setBusy(true);
		setMessage("");
		const response = await fetch("/api/roles", {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ roleId, action: actionName }),
		});
		const data = await response.json();
		if (!response.ok) {
			setMessage(data.error || "Role action failed.");
			setBusy(false);
			return;
		}
		if (method === "DELETE") {
			router.push(rolesPath);
			return;
		}
		setBusy(false);
		router.refresh();
	}

	return (
		<div className="mb-6 flex flex-wrap items-center gap-2">
			{status === "open" && <Button size="2" variant="classic" disabled={busy} onClick={() => action("PATCH", "pause")}>Pause</Button>}
			{status !== "closed" && <Button size="2" variant="classic" disabled={busy} onClick={() => action("PATCH", "close")}>Close</Button>}
			<Button size="2" variant="classic" disabled={busy} onClick={() => action("DELETE")}>Delete</Button>
			{message && <span className="text-3 text-red-10">{message}</span>}
		</div>
	);
}
