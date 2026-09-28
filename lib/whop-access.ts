type RosterAccessChange = {
	companyId: string;
	personWhopId: string | null;
	roleTag: string;
};

export async function grantRosterAccess(change: RosterAccessChange) {
	console.info("[WHOP ACCESS TODO] Bench access grant is not implemented yet.", change);
	return { supported: false as const };
}

export async function revokeRosterAccess(change: RosterAccessChange) {
	console.info("[WHOP ACCESS TODO] Bench access removal is not implemented yet.", change);
	return { supported: false as const };
}
