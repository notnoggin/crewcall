import { NextResponse } from "next/server";
import { defaultQuestions, hiringTypes } from "@/lib/hiring";
import { getSupabaseAdmin } from "@/lib/supabase";
import { positiveInteger, stringValue } from "@/lib/validation";

export async function POST(request: Request) {
	const formData = await request.formData();
	const workspaceId = stringValue(formData.get("workspaceId"));
	const title = stringValue(formData.get("title"));
	const type = stringValue(formData.get("type"));
	const intakeMode = stringValue(formData.get("intakeMode")) || "roster";
	const seatCap = positiveInteger(stringValue(formData.get("seatCap")));
	const platforms = formData.getAll("platforms").map(String);
	const payModel = stringValue(formData.get("payModel"));
	const rateOffered = stringValue(formData.get("rateOffered"));
	const creatorName = stringValue(formData.get("creatorName"));
	const niche = stringValue(formData.get("niche"));
	const geo = stringValue(formData.get("geo"));
	const languages = stringValue(formData.get("languages")).split(",").map((item) => item.trim()).filter(Boolean);
	const rules = stringValue(formData.get("rules"));
	const exampleClipLinks = formData.getAll("exampleClipLinks").map(String).map((item) => item.trim()).filter(Boolean).slice(0, 3);
	const sourceFootageUrl = stringValue(formData.get("sourceFootageUrl"));
	const minAvgViews = positiveInteger(stringValue(formData.get("minAvgViews")));
	const startDate = stringValue(formData.get("startDate"));
	const endDate = stringValue(formData.get("endDate"));

	if (!workspaceId || !title || !hiringTypes.includes(type as never)) {
		return NextResponse.json({ error: "Title and a valid role type are required." }, { status: 400 });
	}
	if (!["roster", "limited_seats"].includes(intakeMode)) {
		return NextResponse.json({ error: "Choose a valid intake mode." }, { status: 400 });
	}
	if (intakeMode === "limited_seats" && !seatCap) {
		return NextResponse.json({ error: "A seat cap is required for limited seats." }, { status: 400 });
	}
	if (!platforms.length) {
		return NextResponse.json({ error: "Select at least one platform." }, { status: 400 });
	}
	if (!payModel || !rateOffered || Number(rateOffered) < 0) {
		return NextResponse.json({ error: "Pay model and rate offered are required." }, { status: 400 });
	}
	if (exampleClipLinks.some((link) => !/^https?:\/\//i.test(link))) {
		return NextResponse.json({ error: "Example clip links must be valid URLs." }, { status: 400 });
	}

	const supabase = getSupabaseAdmin();
	const { data: role, error } = await supabase
		.from("roles")
		.insert({
			workspace_id: workspaceId,
			title,
			type,
			description: rules,
			status: "open",
			capacity: seatCap || 1,
			intake_mode: intakeMode,
			seat_cap: intakeMode === "limited_seats" ? seatCap : null,
			platforms,
			pay_model: payModel || null,
			rate_offered: rateOffered ? Number(rateOffered) : null,
			creator_name: creatorName,
			niche,
			geo,
			languages,
			rules,
			example_clip_links: exampleClipLinks,
			source_footage_url: sourceFootageUrl || null,
			min_avg_views: minAvgViews || null,
			start_date: startDate || null,
			deadline: endDate || null,
		})
		.select("id")
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const { error: templateError } = await supabase.from("application_templates").insert({
		role_id: role.id,
		questions: defaultQuestions[type as keyof typeof defaultQuestions],
	});

	if (templateError) {
		return NextResponse.json({ error: templateError.message }, { status: 500 });
	}

	return NextResponse.json({ roleId: role.id });
}
