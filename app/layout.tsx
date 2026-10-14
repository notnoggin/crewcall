import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import "./globals.css";
import "./bench-import.css";

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://crewcall-ten.vercel.app"),
	title: "Crewcall",
	description: "Hiring pipelines inside Whop",
	openGraph: {
		title: "Crewcall",
		description: "Hiring pipelines inside Whop",
		images: [{ url: "/crewcall-share-banner.png", width: 1200, height: 630, alt: "Crewcall hiring bench" }],
	},
	twitter: {
		card: "summary_large_image",
		title: "Crewcall",
		description: "Hiring pipelines inside Whop",
		images: ["/crewcall-share-banner.png"],
	},
};

/** Runs before paint so the page never flashes light mode when dark is preferred. */
const themeScript = `(function(){try{var t=localStorage.getItem("crewcall-theme");if(t!=="light"&&t!=="dark")t="dark";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" data-theme="dark" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body className="antialiased">
				<WhopApp>{children}</WhopApp>
			</body>
		</html>
	);
}
