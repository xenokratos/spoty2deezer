export const platforms = ['spotify', 'deezer', 'youtubeMusic'];

/** The same parser is used by form validation and the server. */
export function parseMusicLink(input) {
	if (typeof input !== 'string' || input.length > 2048) return null;
	const value = input.trim();
	const uri = value.match(/^spotify:(track|album):([A-Za-z0-9]{22})$/);
	if (uri) return reference('spotify', uri[1], uri[2]);
	try {
		const url = new URL(
			/^https?:\/\//i.test(value) ? value : `https://${value}`,
		);
		if (
			!['https:', 'http:'].includes(url.protocol) ||
			url.username ||
			url.password ||
			url.port
		)
			return null;
		const path = url.pathname;
		let match;
		if (
			['open.spotify.com', 'spotify.com', 'www.spotify.com'].includes(
				url.hostname,
			)
		) {
			match = path.match(
				/^\/(?:intl-[a-z]{2}\/)?(track|album)\/([A-Za-z0-9]{22})\/?$/,
			);
			if (match) return reference('spotify', match[1], match[2]);
		}
		if (['www.deezer.com', 'deezer.com'].includes(url.hostname)) {
			match = path.match(/^\/(?:[a-z]{2}\/)?(track|album)\/(\d+)\/?$/);
			if (match) return reference('deezer', match[1], match[2]);
		}
		if (url.hostname === 'link.deezer.com') {
			match = path.match(/^\/s\/([A-Za-z0-9]+)\/?$/);
			if (match)
				return {
					platform: 'deezer',
					kind: 'track',
					id: `short:${match[1]}`,
					url: `https://link.deezer.com/s/${match[1]}`,
					short: true,
				};
		}
		if (
			[
				'music.youtube.com',
				'www.youtube.com',
				'youtube.com',
				'm.youtube.com',
				'youtu.be',
			].includes(url.hostname)
		) {
			const video =
				url.hostname === 'youtu.be'
					? path.slice(1)
					: path === '/watch'
						? url.searchParams.get('v')
						: path.match(/^\/(?:shorts|embed)\/([\w-]{11})$/)?.[1];
			if (video && /^[\w-]{11}$/.test(video))
				return reference('youtubeMusic', 'track', video);
			const list = path === '/playlist' && url.searchParams.get('list');
			if (list && /^OLAK5uy_[\w-]+$/.test(list))
				return reference('youtubeMusic', 'album', list);
		}
	} catch {
		return null;
	}
	return null;
}

export function reference(platform, kind, id) {
	const url =
		platform === 'spotify'
			? `https://open.spotify.com/${kind}/${id}`
			: platform === 'deezer'
				? `https://www.deezer.com/${kind}/${id}`
				: kind === 'album'
					? `https://music.youtube.com/playlist?list=${id}`
					: `https://music.youtube.com/watch?v=${id}`;
	return { platform, kind, id, url };
}
