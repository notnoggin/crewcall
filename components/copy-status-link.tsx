"use client";

import { useState } from "react";

export function CopyStatusLink({ href }: { href: string }) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		await navigator.clipboard.writeText(href);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1800);
	}

	return <button type="button" onClick={copy} className="button-link">{copied ? "Copied" : "Copy status link"}</button>;
}
