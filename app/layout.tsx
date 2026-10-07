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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased">
				<WhopApp>{children}</WhopApp>
			</body>
		</html>
	);
}
