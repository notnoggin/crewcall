import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getWhopSdk } from "@/lib/whop-sdk";
import { grantRosterAccess, revokeRosterAccess } from "@/lib/whop-access";
import { hasCrewcallAccess } from "@/lib/crewcall-access";

type Action = "assign" | "release" | "pause" | "dismiss" | "reactivate";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ rosterId: string }> },
) {
	try {
		const { hasAccess } = await hasCrewcallAccess();
		if (!hasAccess) return NextResponse.json({ error: "Crewcall Pro membership is required." }, { status: 403 });
		const { rosterId } = await params;
		const body = (await request.json()) as {
			action?: Action;
			reason?: string;
			note?: string;
			roleId?: string | null;
		};
		const reason = body.reason?.trim();
		const note = body.note?.trim();
		const validDismissReasons = ["no-show", "underperformed", "no-longer-needed", "other"];
		if (!body.action || !["assign", "release", "pause", "dismiss", "reactivate"].includes(body.action)) {
			return NextResponse.json({ error: "Choose a valid roster action." }, { status: 400 });
		}
		if (body.action === "dismiss" && (!reason || !validDismissReasons.includes(reason))) {
			return NextResponse.json({ error: "Choose a dismissal reason." }, { status: 400 });
		}

		const { userId } = await getWhopSdk().verifyUserToken(await headers());
		const supabase = getSupabaseAdmin();
		const { data: entry, error: entryError } = await supabase
			.from("roster_entries")
			.select(
				"id, workspace_id, application_id, person_whop_id, role_tag, status, role_id, workspaces!inner(whop_company_id)",
			)
			.eq("id", rosterId)
			.maybeSingle();
		if (entryError || !entry) {
			throw new Error(`Roster member lookup failed: ${entryError?.message || "not found"}`);
		}

		const workspace = Array.isArray(entry.workspaces) ? entry.workspaces[0] : entry.workspaces;
		let nextStatus: "bench" | "active" | "paused" | "dismissed";
		let nextRoleId = entry.role_id;
		let campaignTitle: string | null = null;

		if (body.action === "assign") {
			if (entry.status !== "bench" || !body.roleId) {
				return NextResponse.json(
					{ error: "Only bench members can be assigned, and a campaign is required." },
					{ status: 400 },
				);
			}
			const { data: role } = await supabase
				.from("roles")
				.select("id, title")
				.eq("id", body.roleId)
				.eq("workspace_id", entry.workspace_id)
				.maybeSingle();
			if (!role) {
				return NextResponse.json({ error: "Campaign not found in this workspace." }, { status: 404 });
			}
			nextStatus = "active";
			nextRoleId = role.id;
			campaignTitle = role.title;
		} else if (body.action === "release") {
			if (entry.status !== "active") {
				return NextResponse.json({ error: "Only active members can be released to bench." }, { status: 400 });
			}
			if (entry.role_id) {
				const { data: role } = await supabase.from("roles").select("title").eq("id", entry.role_id).maybeSingle();
				campaignTitle = role?.title || null;
			}
			nextStatus = "bench";
			nextRoleId = null;
		} else if (body.action === "pause") {
			if (entry.status === "dismissed") {
				return NextResponse.json({ error: "Dismissed members cannot be paused." }, { status: 400 });
			}
			nextStatus = "paused";
		} else if (body.action === "dismiss") {
			if (entry.status === "dismissed") {
				return NextResponse.json({ error: "This member is already dismissed." }, { status: 400 });
			}
			nextStatus = "dismissed";
			nextRoleId = null;
		} else {
			if (entry.status !== "paused") {
				return NextResponse.json({ error: "Only paused members can be reactivated." }, { status: 400 });
			}
			nextStatus = "bench";
			nextRoleId = null;
		}

		const { error: updateError } = await supabase
			.from("roster_entries")
			.update({
				status: nextStatus,
				role_id: nextRoleId,
				last_active_at:
					nextStatus === "active"
						? new Date().toISOString()
						: entry.status === "active"
							? new Date().toISOString()
							: undefined,
			})
			.eq("id", rosterId);
		if (updateError) throw new Error(`Roster update failed: ${updateError.message}`);

		// Application-linked rows only (CSV imports have application_id = null).
		if (entry.application_id) {
			const { error: applicationStatusError } = await supabase
				.from("applications")
				.update({ status: nextStatus })
				.eq("id", entry.application_id);
			if (applicationStatusError) {
				throw new Error(`Application status update failed: ${applicationStatusError.message}`);
			}

			const { error: eventError } = await supabase.from("application_events").insert({
				application_id: entry.application_id,
				actor_id: userId,
				action: `roster_${body.action}`,
				note:
					[
						campaignTitle ? `Campaign: ${campaignTitle}` : null,
						reason ? `Reason: ${reason}` : null,
						note,
					]
						.filter(Boolean)
						.join(". ") || null,
			});
			if (eventError) throw new Error(`Roster history write failed: ${eventError.message}`);
		}

		// Whop access only when we have a person_whop_id (imports often don't).
		if (entry.person_whop_id) {
			const accessChange = {
				companyId: workspace.whop_company_id,
				personWhopId: entry.person_whop_id,
				roleTag: entry.role_tag,
			};
			if (body.action === "assign") await grantRosterAccess(accessChange);
			if (body.action === "dismiss") await revokeRosterAccess(accessChange);
		}

		return NextResponse.json({ ok: true, status: nextStatus });
	} catch (error) {
		console.error("Crewcall roster action failed:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Roster action failed." },
			{ status: 500 },
		);
	}
}
