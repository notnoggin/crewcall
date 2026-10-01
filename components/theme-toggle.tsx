"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>("light");

	useEffect(() => {
		const stored = window.localStorage.getItem("crewcall-theme") as Theme | null;
		const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		const nextTheme = stored === "dark" || stored === "light" ? stored : preferred;
		document.documentElement.dataset.theme = nextTheme;
		setTheme(nextTheme);
	}, []);

	function toggleTheme() {
		const nextTheme = theme === "dark" ? "light" : "dark";
		document.documentElement.dataset.theme = nextTheme;
		window.localStorage.setItem("crewcall-theme", nextTheme);
		setTheme(nextTheme);
	}

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="theme-toggle"
			aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
			title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
		>
			<span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
			<span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
		</button>
	);
}
