import { NextResponse } from "next/server";
import { hiringTypes } from "@/lib/hiring";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hasCrewcallAccess } from "@/lib/crewcall-access";

export async function POST(request: Request) {
	try {
		const { hasAccess } = await hasCrewcallAccess();
		if (!hasAccess) return NextResponse.json({ error: "Crewcall Pro membership is required." }, { status: 403 });
		const body = (await request.json()) as { companyId?: string; hiringType?: string; starterRoles?: number };
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

		const starterRoles = Math.max(0, Math.min(2, Math.floor(body.starterRoles ?? 1)));
		if (starterRoles > 0) {
			const roleTitle = hiringType === "clipper" ? "First clipping roster" : hiringType === "moderator" ? "First moderation roster" : hiringType === "va" ? "First VA roster" : "First Crewcall roster";
			const secondTitle = hiringType === "clipper" ? "Second clipping roster" : hiringType === "moderator" ? "Second moderation roster" : hiringType === "va" ? "Second VA roster" : "Second Crewcall roster";
			const { data: roles, error: roleError } = await supabase.from("roles").insert(
				Array.from({ length: starterRoles }, (_, index) => ({
					workspace_id: workspace.id,
					title: index === 0 ? roleTitle : secondTitle,
					type: hiringType,
					description: "",
					status: "draft",
					capacity: 1,
				})),
			).select("id");
			if (roleError) throw new Error(`Starter role creation failed: ${roleError.message}`);
			if (roles?.length) {
				const { error: templateError } = await supabase.from("application_templates").insert(roles.map((role) => ({ role_id: role.id, questions: [] })));
				if (templateError) throw new Error(`Starter template creation failed: ${templateError.message}`);
			}
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
