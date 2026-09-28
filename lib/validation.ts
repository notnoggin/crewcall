export function stringValue(value: FormDataEntryValue | null) {
	return typeof value === "string" ? value.trim() : "";
}

export function positiveInteger(value: string, fallback = 1) {
	const parsed = Number.parseInt(value, 10);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
