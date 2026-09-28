export const hiringTypes = ["clipper", "moderator", "va", "custom"] as const;
export type HiringType = (typeof hiringTypes)[number];

export type ApplicationQuestion = {
	id: string;
	label: string;
	type: "text" | "textarea" | "url";
	required?: boolean;
};

export const hiringTypeLabels: Record<HiringType, string> = {
	clipper: "Clipper",
	moderator: "Moderator",
	va: "VA",
	custom: "Custom",
};

export const defaultQuestions: Record<HiringType, ApplicationQuestion[]> = {
	clipper: [
		{ id: "experience", label: "Tell us about your editing experience.", type: "textarea", required: true },
		{ id: "portfolio", label: "Share a link to your portfolio.", type: "url", required: true },
		{ id: "availability", label: "What is your weekly availability?", type: "text", required: true },
	],
	moderator: [
		{ id: "experience", label: "Tell us about your moderation experience.", type: "textarea", required: true },
		{ id: "scenario", label: "How would you handle a difficult community situation?", type: "textarea", required: true },
		{ id: "availability", label: "What is your weekly availability?", type: "text", required: true },
	],
	va: [
		{ id: "experience", label: "What operations or admin work have you done before?", type: "textarea", required: true },
		{ id: "tools", label: "Which tools are you most comfortable using?", type: "text", required: true },
		{ id: "availability", label: "What is your weekly availability?", type: "text", required: true },
	],
	custom: [
		{ id: "experience", label: "Tell us why you are a strong fit for this role.", type: "textarea", required: true },
		{ id: "availability", label: "What is your weekly availability?", type: "text", required: true },
	],
};
