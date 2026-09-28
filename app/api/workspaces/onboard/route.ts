import { NextResponse } from "next/server";
import { defaultQuestions, hiringTypeLabels, hiringTypes } from "@/lib/hiring";
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
		const { data: existing } = await supabase
			.from("workspaces")
			.select("id")
			.eq("whop_company_id", companyId)
			.maybeSingle();
		const { data: workspace, error } = await supabase
			.from("workspaces")
			.upsert({ whop_company_id: companyId, hiring_type: hiringType }, { onConflict: "whop_company_id" })
			.select("id")
			.single();

		if (error) {
			throw new Error(`Workspace upsert failed: ${error.message}`);
		}

		const { data: existingRole } = existing
			? await supabase
					.from("roles")
					.select("id")
					.eq("workspace_id", workspace.id)
					.limit(1)
					.maybeSingle()
			: { data: null };

		if (!existingRole) {
			const { data: role, error: roleError } = await supabase
				.from("roles")
				.insert({
					workspace_id: workspace.id,
					title: `${hiringTypeLabels[hiringType as keyof typeof hiringTypeLabels]} application`,
					type: hiringType,
					description: "Default application template role",
					status: "draft",
					capacity: 1,
				})
				.select("id")
				.single();

			if (roleError || !role) {
				throw new Error(`Default role creation failed: ${roleError?.message || "no role was returned"}`);
			}

			const { error: templateError } = await supabase.from("application_templates").insert({
				role_id: role.id,
				questions: defaultQuestions[hiringType as keyof typeof defaultQuestions],
			});

			if (templateError) {
				throw new Error(`Application template creation failed: ${templateError.message}`);
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
