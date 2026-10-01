export const currencies = [
	{ code: "USD", symbol: "$", label: "USD $" },
	{ code: "EUR", symbol: "€", label: "EUR €" },
	{ code: "GBP", symbol: "£", label: "GBP £" },
	{ code: "NGN", symbol: "₦", label: "NGN ₦" },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];

export function currencySymbol(code: string | null | undefined) {
	return currencies.find((currency) => currency.code === code)?.symbol || "$";
}

export function parseViewCount(value: string) {
	const normalized = value.trim().replace(/,/g, "");
	const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([kKmM])?$/);
	if (!match) return null;
	const amount = Number(match[1]);
	const multiplier = match[2]?.toLowerCase() === "m" ? 1_000_000 : match[2] ? 1_000 : 1;
	const result = Math.round(amount * multiplier);
	return Number.isFinite(result) ? result : null;
}

export function formatViewCount(value: string | number) {
	const count = typeof value === "number" ? value : parseViewCount(value);
	if (count === null || !Number.isFinite(count)) return String(value);
	if (count >= 1_000_000) return `${Number((count / 1_000_000).toFixed(1))}M`;
	if (count >= 1_000) return `${Number((count / 1_000).toFixed(1))}K`;
	return String(count);
}
