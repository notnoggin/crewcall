import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "edge";

export async function GET(_request: Request, { params }: { params: Promise<{ role_id: string }> }) {
	const { role_id: roleId } = await params;
	try {
		const { data: role } = await getSupabaseAdmin().from("roles").select("title, platforms, pay_model, rate_offered, intake_mode, seat_cap, applications(status)").eq("id", roleId).maybeSingle();
		if (!role) return staticBanner(_request);
	const approved = Array.isArray(role.applications) ? role.applications.filter((item) => ["bench", "active", "paused"].includes(item.status)).length : 0;
	const seats = role.intake_mode === "limited_seats" && role.seat_cap ? `${Math.max(role.seat_cap - approved, 0)} seats remaining` : "Open roster";
	return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#111113", color: "white", fontFamily: "sans-serif" }}><div style={{ display: "flex", fontSize: 28, color: "#aaa" }}>CREWCALL ROSTER</div><div style={{ display: "flex", flexDirection: "column", gap: 18 }}><div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>{role.title}</div><div style={{ display: "flex", fontSize: 30, color: "#d0d0d0" }}>{role.platforms?.join(" · ") || "Flexible platforms"}</div><div style={{ display: "flex", fontSize: 28, color: "#d0d0d0" }}>{role.pay_model || "Details shared during review"}{role.rate_offered !== null ? ` · ${role.rate_offered}` : ""} · {seats}</div><div style={{ display: "flex", marginTop: 18, fontSize: 30, color: "#8ee6a8" }}>Apply to roster</div></div><div style={{ display: "flex", fontSize: 22, color: "#888" }}>Powered by Crewcall</div></div>, { width: 1200, height: 630 });
	} catch (error) {
		console.error("Crewcall banner generation failed:", error);
		return staticBanner(_request);
	}
}

async function staticBanner(request: Request) {
	const url = new URL("/crewcall-share-banner.png", request.url);
	return fetch(url);
}
