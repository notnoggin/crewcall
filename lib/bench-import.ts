export const BENCH_IMPORT_ROLE_TAGS = ["clipper", "moderator", "editor", "va", "ops"] as const;
export type BenchImportRoleTag = (typeof BENCH_IMPORT_ROLE_TAGS)[number];

export const BENCH_IMPORT_STATUSES = ["bench", "active", "paused"] as const;
export type BenchImportStatus = (typeof BENCH_IMPORT_STATUSES)[number];

export const BENCH_IMPORT_MAX_ROWS = 200;

export type BenchImportRow = {
	line: number;
	name: string;
	email: string;
	role_tag: BenchImportRoleTag;
	handle: string | null;
	platforms: string[];
	weekly_capacity: number | null;
	timezone: string | null;
	rate: number | null;
	notes: string | null;
	status: BenchImportStatus;
};

export type BenchImportRowError = {
	line: number;
	message: string;
};

const HEADER_ALIASES: Record<string, string> = {
	name: "name",
	"full name": "name",
	fullname: "name",
	email: "email",
	"e-mail": "email",
	"email address": "email",
	role: "role_tag",
	"role tag": "role_tag",
	"role_tag": "role_tag",
	type: "role_tag",
	handle: "handle",
	"discord": "handle",
	"discord handle": "handle",
	"ig": "handle",
	"instagram": "handle",
	"username": "handle",
	platforms: "platforms",
	platform: "platforms",
	"weekly capacity": "weekly_capacity",
	"weekly_capacity": "weekly_capacity",
	capacity: "weekly_capacity",
	timezone: "timezone",
	tz: "timezone",
	rate: "rate",
	"rate requested": "rate",
	"pay rate": "rate",
	notes: "notes",
	note: "notes",
	status: "status",
};

function normalizeHeader(raw: string): string | null {
	const key = raw.trim().toLowerCase().replace(/[_-]+/g, " ");
	return HEADER_ALIASES[key] ?? null;
}

/** Minimal CSV parser: supports quoted fields and commas inside quotes. */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let inQuotes = false;

	const pushCell = () => {
		row.push(cell);
		cell = "";
	};
	const pushRow = () => {
		// Skip fully empty trailing lines
		if (row.some((c) => c.trim().length > 0)) rows.push(row);
		row = [];
	};

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		const next = text[i + 1];

		if (inQuotes) {
			if (ch === '"' && next === '"') {
				cell += '"';
				i += 1;
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				cell += ch;
			}
			continue;
		}

		if (ch === '"') {
			inQuotes = true;
		} else if (ch === ",") {
			pushCell();
		} else if (ch === "\n") {
			pushCell();
			pushRow();
		} else if (ch === "\r") {
			// ignore; handle \r\n via \n
		} else {
			cell += ch;
		}
	}

	pushCell();
	pushRow();
	return rows;
}

function parseRoleTag(raw: string): BenchImportRoleTag | null {
	const v = raw.trim().toLowerCase();
	if (!v) return "clipper";
	if ((BENCH_IMPORT_ROLE_TAGS as readonly string[]).includes(v)) return v as BenchImportRoleTag;
	// common aliases
	if (v === "mod" || v === "mods") return "moderator";
	if (v === "virtual assistant" || v === "assistant") return "va";
	if (v === "clippers" || v === "clip") return "clipper";
	return null;
}

function parseStatus(raw: string): BenchImportStatus | null {
	const v = raw.trim().toLowerCase();
	if (!v) return "bench";
	if (v === "ready" || v === "available") return "bench";
	if (v === "assigned") return "active";
	if ((BENCH_IMPORT_STATUSES as readonly string[]).includes(v)) return v as BenchImportStatus;
	return null;
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseBenchImportCsv(text: string): {
	rows: BenchImportRow[];
	errors: BenchImportRowError[];
} {
	const cleaned = text.replace(/^\uFEFF/, "").trim();
	if (!cleaned) {
		return { rows: [], errors: [{ line: 0, message: "File is empty." }] };
	}

	const grid = parseCsv(cleaned);
	if (grid.length < 2) {
		return {
			rows: [],
			errors: [{ line: 1, message: "CSV needs a header row and at least one data row." }],
		};
	}

	const headerCells = grid[0];
	const colIndex: Partial<Record<string, number>> = {};
	headerCells.forEach((h, i) => {
		const key = normalizeHeader(h);
		if (key && colIndex[key] === undefined) colIndex[key] = i;
	});

	if (colIndex.name === undefined || colIndex.email === undefined) {
		return {
			rows: [],
			errors: [
				{
					line: 1,
					message: 'Header must include "name" and "email" columns.',
				},
			],
		};
	}

	const rows: BenchImportRow[] = [];
	const errors: BenchImportRowError[] = [];
	const seenEmails = new Set<string>();

	for (let r = 1; r < grid.length; r++) {
		const line = r + 1;
		const cells = grid[r];
		const get = (key: string) => {
			const idx = colIndex[key];
			if (idx === undefined) return "";
			return (cells[idx] ?? "").trim();
		};

		const name = get("name");
		const email = get("email").toLowerCase();
		if (!name && !email) continue;

		if (!name) {
			errors.push({ line, message: "Name is required." });
			continue;
		}
		if (!email || !isValidEmail(email)) {
			errors.push({ line, message: "A valid email is required." });
			continue;
		}
		if (seenEmails.has(email)) {
			errors.push({ line, message: `Duplicate email in file: ${email}` });
			continue;
		}
		seenEmails.add(email);

		const roleRaw = get("role_tag");
		const role_tag = parseRoleTag(roleRaw);
		if (!role_tag) {
			errors.push({
				line,
				message: `Invalid role "${roleRaw}". Use: clipper, moderator, editor, va, or ops.`,
			});
			continue;
		}

		const statusRaw = get("status");
		const status = parseStatus(statusRaw);
		if (!status) {
			errors.push({
				line,
				message: `Invalid status "${statusRaw}". Use: bench, active, or paused.`,
			});
			continue;
		}

		const capacityRaw = get("weekly_capacity");
		let weekly_capacity: number | null = null;
		if (capacityRaw) {
			const n = Number(capacityRaw);
			if (!Number.isFinite(n) || n < 0) {
				errors.push({ line, message: "Weekly capacity must be a number ≥ 0." });
				continue;
			}
			weekly_capacity = Math.round(n);
		}

		const rateRaw = get("rate");
		let rate: number | null = null;
		if (rateRaw) {
			const n = Number(rateRaw.replace(/[$,]/g, ""));
			if (!Number.isFinite(n) || n < 0) {
				errors.push({ line, message: "Rate must be a number ≥ 0." });
				continue;
			}
			rate = n;
		}

		const platforms = get("platforms")
			.split(/[,|;]/)
			.map((p) => p.trim())
			.filter(Boolean);

		rows.push({
			line,
			name,
			email,
			role_tag,
			handle: get("handle") || null,
			platforms,
			weekly_capacity,
			timezone: get("timezone") || null,
			rate,
			notes: get("notes") || null,
			status,
		});
	}

	if (rows.length > BENCH_IMPORT_MAX_ROWS) {
		return {
			rows: [],
			errors: [
				{
					line: 0,
					message: `Too many rows (${rows.length}). Import up to ${BENCH_IMPORT_MAX_ROWS} at a time.`,
				},
			],
		};
	}

	return { rows, errors };
}

export const BENCH_IMPORT_TEMPLATE_CSV = [
	"name,email,role_tag,handle,platforms,weekly_capacity,timezone,rate,notes,status",
	"Alex Rivera,alex@example.com,clipper,@alexr,\"TikTok, Instagram\",40,America/New_York,25,Top performer on short-form,bench",
	"Sam Chen,sam@example.com,moderator,sam#1234,Discord,20,America/Los_Angeles,18,Night coverage preferred,bench",
].join("\n");
