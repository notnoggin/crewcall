export function isSupportedClipUrl(value: string) {
	try {
		const url = new URL(value);
		const host = url.hostname.toLowerCase().replace(/^www\./, "");
		if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return Boolean(url.pathname.replaceAll("/", ""));
		if (host === "instagram.com" || host.endsWith(".instagram.com")) return /^\/(reel|reels)\//i.test(url.pathname);
		if (host === "youtube.com" || host.endsWith(".youtube.com")) return /^\/shorts\//i.test(url.pathname);
		if (host === "youtu.be") return Boolean(url.pathname.replaceAll("/", ""));
		return false;
	} catch {
		return false;
	}
}

export function answerLabel(key: string) {
	return key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}
