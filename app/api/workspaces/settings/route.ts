import { NextResponse } from "next/server";
import { hiringTypes } from "@/lib/hiring";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hasCrewcallAccess } from "@/lib/crewcall-access";

export async function PATCH(request: Request) {
	try {
		const { hasAccess } = await hasCrewcallAccess();
		if (!hasAccess) return NextResponse.json({ error: "Crewcall Pro membership is required." }, { status: 403 });
		const body = (await request.json()) as { companyId?: string; name?: string; hiringType?: string };
		const companyId = body.companyId?.trim();
		const name = body.name?.trim();
		if (!companyId || !name || !body.hiringType || !hiringTypes.includes(body.hiringType as never)) {
			return NextResponse.json({ error: "Workspace name and hiring type are required." }, { status: 400 });
		}

		const { data, error } = await getSupabaseAdmin()
			.from("workspaces")
			.update({ name, hiring_type: body.hiringType })
			.eq("whop_company_id", companyId)
			.select("name, hiring_type")
			.single();
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		return NextResponse.json({ workspace: data });
	} catch (error) {
		console.error("Workspace settings update failed:", error);
		return NextResponse.json({ error: "Could not save workspace settings." }, { status: 500 });
	}
}
