export const runtime = "edge";

export async function GET(request: Request) {
	const url = new URL("/crewcall-share-banner.png", request.url);
	return fetch(url);
}
