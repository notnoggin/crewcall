import { hasCrewcallAccess } from "@/lib/crewcall-access";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isWorkspaceOnboarded } from "@/lib/workspace";
import { Paywall } from "@/components/paywall";

export default async function DashboardLayout({
	children,
	params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ companyId: string }> }>) {
	try {
		const { companyId } = await params;

		const { data: workspace } = await getSupabaseAdmin()
			.from("workspaces")
			.select("id, name")
			.eq("whop_company_id", companyId)
			.maybeSingle();

		// Only gate after the user has completed onboarding (set a real workspace name).
		if (!isWorkspaceOnboarded(workspace)) {
			return children;
		}

		const { hasAccess, paywallKind, ctaUrl, manageUrl } = await hasCrewcallAccess();

		if (!hasAccess) {
			return (
				<Paywall
					kind={paywallKind}
					workspaceName={workspace?.name}
					ctaUrl={ctaUrl}
					manageUrl={manageUrl}
				/>
			);
		}
	} catch (error) {
		console.error("Crewcall access check failed:", error);
		return children;
	}

	return children;
}
