import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { positiveInteger, stringValue } from "@/lib/validation";

export async function POST(request: Request) {
	const formData = await request.formData();
	const workspaceId = stringValue(formData.get("workspaceId"));
	const title = stringValue(formData.get("title"));
	const type = stringValue(formData.get("type"));
	const description = stringValue(formData.get("description"));
	const capacity = positiveInteger(stringValue(formData.get("capacity")));

	if (!workspaceId || !title || !type) {
		return NextResponse.json({ error: "Title and type are required." }, { status: 400 });
	}

	const supabase = getSupabaseAdmin();
	const { data: role, error } = await supabase
		.from("roles")
		.insert({ workspace_id: workspaceId, title, type, description, capacity, status: "open" })
		.select("id")
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const { error: templateError } = await supabase.from("application_templates").insert({
		role_id: role.id,
		questions: [],
	});

	if (templateError) {
		return NextResponse.json({ error: templateError.message }, { status: 500 });
	}

	return NextResponse.json({ roleId: role.id });
}
