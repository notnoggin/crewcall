/**
 * Default name applied by the DB migration when a workspace row is created
 * without an explicit name (e.g. the old install webhook).
 * A workspace is only considered onboarded after the user sets a real name
 * through the onboarding form.
 */
export const DEFAULT_WORKSPACE_NAME = "Crewcall workspace";

export function isWorkspaceOnboarded(workspace: {
	name?: string | null;
} | null): boolean {
	if (!workspace) return false;
	const name = workspace.name?.trim() ?? "";
	if (!name) return false;
	// Rows created by the old install webhook (or the DB default) keep this name.
	// They must still go through onboarding.
	if (name === DEFAULT_WORKSPACE_NAME) return false;
	return true;
}
