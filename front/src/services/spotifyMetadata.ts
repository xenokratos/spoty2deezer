/** Read Spotify's structured embed metadata without guessing artists from titles. */
export function parseSpotifyEmbed(
	html: string,
	kind: 'track' | 'album',
	id: string,
): { name: string; artists: string[] } | undefined {
	try {
		const script = html.match(
			/<script\b(?=[^>]*\bid=["']__NEXT_DATA__["'])[^>]*>([\s\S]*?)<\/script>/i,
		)?.[1];
		if (!script) return;
		const entity = JSON.parse(script)?.props?.pageProps?.state?.data?.entity;
		if (
			entity?.uri !== `spotify:${kind}:${id}` ||
			typeof entity.name !== 'string' ||
			!entity.name.trim() ||
			!Array.isArray(entity.artists)
		)
			return;
		const artists = entity.artists.flatMap((artist: { name?: unknown }) =>
			typeof artist?.name === 'string' && artist.name.trim()
				? [artist.name.trim()]
				: [],
		);
		if (!artists.length) return;
		return { name: entity.name.trim(), artists };
	} catch {
		return;
	}
}
