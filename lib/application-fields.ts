export function isSupportedClipUrl(value: string) {
	try {
		const url = new URL(value);
		const host = url.hostname.toLowerCase().replace(/^www\./, "");
		if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return Boolean(url.pathname.replaceAll("/", ""));
		if (host === "instagram.com" || host.endsWith(".instagram.com")) return /^\/(reel|reels)\//i.test(url.pathname);
		if (host === "youtube.com" || host.endsWith(".youtube.com")) return /^\/shorts\//i.test(url.pathname);
		return false;
	} catch {
		return false;
	}
}

export function isClipUrlForPlatforms(value: string, platforms: string[]) {
	if (!platforms.length) return isSupportedClipUrl(value);
	try {
		const url = new URL(value);
		const host = url.hostname.toLowerCase().replace(/^www\./, "");
		const selected = new Set(platforms.map((platform) => platform.toLowerCase()));
		if (selected.has("tiktok") && (host === "tiktok.com" || host.endsWith(".tiktok.com"))) return Boolean(url.pathname.replaceAll("/", ""));
		if (selected.has("reels") && (host === "instagram.com" || host.endsWith(".instagram.com"))) return /^\/(reel|reels)\//i.test(url.pathname);
		if (selected.has("shorts") && (host === "youtube.com" || host.endsWith(".youtube.com"))) return /^\/shorts\//i.test(url.pathname);
		return false;
	} catch {
		return false;
	}
}

export function clipPlatformMessage(platforms: string[]) {
	if (platforms.length === 1) return `This role only accepts ${platforms[0]} links.`;
	return `This role only accepts ${platforms.join(", ")} links.`;
}

export function answerLabel(key: string) {
	return key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}
