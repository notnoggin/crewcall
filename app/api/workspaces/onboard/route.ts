import { NextResponse } from "next/server";
import { hiringTypes } from "@/lib/hiring";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { companyId?: string; hiringType?: string };
		const companyId = body.companyId?.trim();
		const hiringType = body.hiringType;

		if (!companyId || !hiringType || !hiringTypes.includes(hiringType as never)) {
			return NextResponse.json({ error: "A company and hiring type are required." }, { status: 400 });
		}

		const supabase = getSupabaseAdmin();
		const { data: workspace, error } = await supabase
			.from("workspaces")
			.upsert({ whop_company_id: companyId, hiring_type: hiringType }, { onConflict: "whop_company_id" })
			.select("id")
			.single();

		if (error) {
			throw new Error(`Workspace upsert failed: ${error.message}`);
		}

		return NextResponse.json({ workspaceId: workspace.id });
	} catch (error) {
		console.error("Crewcall onboarding API failed:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Crewcall onboarding failed unexpectedly. Check the server logs.",
			},
			{ status: 500 },
		);
	}
}
