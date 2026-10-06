"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>("dark");

	useEffect(() => {
		const stored = window.localStorage.getItem("crewcall-theme") as Theme | null;
		const preferred: Theme = "dark";
		const nextTheme = stored === "dark" || stored === "light" ? stored : preferred;
		document.documentElement.dataset.theme = nextTheme;
		setTheme(nextTheme);
	}, []);

	function setMode(next: Theme) {
		if (next === theme) return;
		document.documentElement.dataset.theme = next;
		window.localStorage.setItem("crewcall-theme", next);
		setTheme(next);
	}

	return (
		<div className="theme-switch" role="group" aria-label="Color theme">
			<button
				type="button"
				className={`theme-switch-option ${theme === "light" ? "is-active" : ""}`}
				onClick={() => setMode("light")}
				aria-pressed={theme === "light"}
				title="Light mode"
			>
				<span aria-hidden="true" className="theme-switch-icon">
					☀
				</span>
				<span className="theme-switch-label">Light</span>
			</button>
			<button
				type="button"
				className={`theme-switch-option ${theme === "dark" ? "is-active" : ""}`}
				onClick={() => setMode("dark")}
				aria-pressed={theme === "dark"}
				title="Dark mode"
			>
				<span aria-hidden="true" className="theme-switch-icon">
					☾
				</span>
				<span className="theme-switch-label">Dark</span>
			</button>
		</div>
	);
}
