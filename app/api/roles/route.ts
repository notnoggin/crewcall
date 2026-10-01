import { NextResponse } from "next/server";
import { defaultQuestions, hiringTypes } from "@/lib/hiring";
import { getSupabaseAdmin } from "@/lib/supabase";
import { positiveInteger, stringValue } from "@/lib/validation";
import { hasCrewcallAccess } from "@/lib/crewcall-access";

export async function POST(request: Request) {
	const { hasAccess } = await hasCrewcallAccess();
	if (!hasAccess) return NextResponse.json({ error: "Crewcall Pro membership is required." }, { status: 403 });
	const formData = await request.formData();
	const workspaceId = stringValue(formData.get("workspaceId"));
	const title = stringValue(formData.get("title"));
	const type = stringValue(formData.get("type"));
	const intakeMode = stringValue(formData.get("intakeMode")) || "roster";
	const saveDraft = stringValue(formData.get("saveDraft")) === "true";
	const seatCap = positiveInteger(stringValue(formData.get("seatCap")));
	const platforms = formData.getAll("platforms").map(String);
	const payModel = stringValue(formData.get("payModel"));
	const rateCurrency = stringValue(formData.get("rateCurrency")) || "USD";
	const activeFields = (() => {
		try {
			const parsed = JSON.parse(stringValue(formData.get("activeFields")));
			return Array.isArray(parsed) ? parsed.filter((field): field is string => typeof field === "string") : [];
		} catch {
			return [];
		}
	})();
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
	const customQuestions = formData.getAll("customQuestions").map(String).map((label) => label.trim()).filter(Boolean);

	if (!workspaceId || !title || !hiringTypes.includes(type as never)) {
		return NextResponse.json({ error: "Title and a valid role type are required." }, { status: 400 });
	}
	if (!["roster", "limited_seats"].includes(intakeMode)) {
		return NextResponse.json({ error: "Choose a valid intake mode." }, { status: 400 });
	}
	if (intakeMode === "limited_seats" && !seatCap) {
		return NextResponse.json({ error: "A seat cap is required for limited seats." }, { status: 400 });
	}
	if (!saveDraft && type === "clipper" && !platforms.length) {
		return NextResponse.json({ error: "Select at least one platform." }, { status: 400 });
	}
	if (!saveDraft && (!payModel || !rateOffered || Number(rateOffered) < 0)) {
		return NextResponse.json({ error: "Pay model and rate offered are required." }, { status: 400 });
	}
	if (payModel && !["cpm", "per_clip", "flat_fee", "hourly", "per_task", "custom"].includes(payModel)) {
		return NextResponse.json({ error: "Choose a valid pay model." }, { status: 400 });
	}
	if (!["USD", "EUR", "GBP", "NGN"].includes(rateCurrency)) {
		return NextResponse.json({ error: "Choose a supported currency." }, { status: 400 });
	}
	if (exampleClipLinks.some((link) => !/^https?:\/\//i.test(link))) {
		return NextResponse.json({ error: "Example clip links must be valid URLs." }, { status: 400 });
	}

	const supabase = getSupabaseAdmin();
	const rolePayload = {
		workspace_id: workspaceId,
		title,
		type,
		description: rules,
		status: saveDraft ? "draft" : "open",
		capacity: seatCap || 1,
		intake_mode: intakeMode,
		seat_cap: intakeMode === "limited_seats" ? seatCap : null,
		platforms,
		pay_model: payModel || null,
		rate_currency: rateCurrency,
		rate_offered: rateOffered ? Number(rateOffered) : null,
		active_fields: activeFields,
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
	};
	let { data: role, error } = await supabase
		.from("roles")
		.insert(rolePayload)
		.select("id, title, type, description, status, capacity, intake_mode, seat_cap, platforms, pay_model, rate_offered, creator_name, niche, rules, start_date, deadline")
		.single();

	if (error && /active_fields/i.test(error.message)) {
		const legacyPayload = { ...rolePayload };
		delete (legacyPayload as Partial<typeof rolePayload>).active_fields;
		const retry = await supabase.from("roles").insert(legacyPayload).select("id, title, type, description, status, capacity, intake_mode, seat_cap, platforms, pay_model, rate_offered, creator_name, niche, rules, start_date, deadline").single();
		role = retry.data;
		error = retry.error;
	}

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	if (!role) {
		return NextResponse.json({ error: "Role creation returned no role." }, { status: 500 });
	}

	const questions = type === "moderator"
		? [
				{ id: "spam", label: stringValue(formData.get("moderatorSpamQuestion")) || "How would you handle spam?", type: "textarea", required: true },
				{ id: "refundRage", label: stringValue(formData.get("moderatorRefundQuestion")) || "How would you handle refund rage?", type: "textarea", required: true },
				{ id: "payArgument", label: stringValue(formData.get("moderatorPayQuestion")) || "What would you do if a clipper argued about pay?", type: "textarea", required: true },
			]
		: type === "custom"
			? customQuestions.map((label, index) => ({ id: `custom_${index + 1}`, label, type: "textarea" as const, required: false }))
			: defaultQuestions[type as keyof typeof defaultQuestions];
	const { error: templateError } = await supabase.from("application_templates").insert({
		role_id: role.id,
		questions,
	});

	if (templateError) {
		return NextResponse.json({ error: templateError.message }, { status: 500 });
	}

	return NextResponse.json({ roleId: role.id, role, savedAsDraft: saveDraft });
}

export async function PATCH(request: Request) {
	const { hasAccess } = await hasCrewcallAccess();
	if (!hasAccess) return NextResponse.json({ error: "Crewcall Pro membership is required." }, { status: 403 });
	const body = (await request.json()) as { roleId?: string; action?: "publish" | "pause" | "close" };
	if (!body.roleId || !body.action) return NextResponse.json({ error: "Role and action are required." }, { status: 400 });
	const status = body.action === "publish" ? "open" : body.action === "pause" ? "draft" : "closed";
	const { error } = await getSupabaseAdmin().from("roles").update({ status }).eq("id", body.roleId);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ ok: true, status });
}

export async function DELETE(request: Request) {
	const { hasAccess } = await hasCrewcallAccess();
	if (!hasAccess) return NextResponse.json({ error: "Crewcall Pro membership is required." }, { status: 403 });
	const body = (await request.json()) as { roleId?: string };
	if (!body.roleId) return NextResponse.json({ error: "Role is required." }, { status: 400 });
	const supabase = getSupabaseAdmin();
	const { data: role, error: roleError } = await supabase.from("roles").select("status").eq("id", body.roleId).maybeSingle();
	if (roleError || !role) return NextResponse.json({ error: "Role not found." }, { status: 404 });
	if (role.status !== "draft") return NextResponse.json({ error: "Only draft roles can be deleted." }, { status: 400 });
	const { error } = await supabase.from("roles").delete().eq("id", body.roleId);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ ok: true });
}
