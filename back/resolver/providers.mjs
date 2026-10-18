import { parseMusicLink, reference } from '../lib/music-link.mjs';
import { ProviderError } from './errors.mjs';
import {
	deezerMedia,
	media,
	parseSpotifyEmbed,
	parseYouTubeAlbum,
} from './metadata.mjs';

export function searchLink(platform, source) {
	const query = encodeURIComponent(
		`${source.artist} ${source.title}${source.kind === 'album' ? ' album' : ''}`.trim(),
	);
	const url =
		platform === 'spotify'
			? `https://open.spotify.com/search/${query}`
			: platform === 'deezer'
				? `https://www.deezer.com/search/${query}`
				: `https://music.youtube.com/search?q=${query}`;
	return {
		...source,
		id: `search:${platform}:${source.id}`,
		url,
		search: true,
		quality: false,
		match: { method: 'search', reasons: ['search_only'] },
	};
}

export function createProviders({ http, env = process.env }) {
	function albumPage(value, id) {
		const url = new URL(value);
		const host = 'api.deezer.com';
		const path = `/album/${id}/tracks`;
		if (
			url.protocol !== 'https:' ||
			url.hostname !== host ||
			url.pathname !== path ||
			url.username ||
			url.password ||
			url.port
		)
			throw new ProviderError('INVALID_UPSTREAM_URL');
		return url;
	}
	async function enrich(candidates, read) {
		if (!candidates.length) return { candidates: [] };
		const outcomes = await Promise.allSettled(candidates.map(read));
		const valid = outcomes
			.filter((x) => x.status === 'fulfilled')
			.map((x) => x.value);
		if (!valid.length)
			throw outcomes.find((x) => x.status === 'rejected').reason;
		return { candidates: valid, partial: valid.length !== candidates.length };
	}

	const spotify = {
		capabilities: { catalog: false, source: true, albums: true },
		async get(ref, { signal }) {
			try {
				return parseSpotifyEmbed(
					await http.get(
						`https://open.spotify.com/embed/${ref.kind}/${ref.id}`,
						{ signal },
					),
					ref,
				);
			} catch (error) {
				if (signal.aborted) throw error;
				const value = await http.get('https://open.spotify.com/oembed', {
					signal,
					params: { url: ref.url },
				});
				return media(
					ref,
					{ title: value.title, artists: [], artwork: value.thumbnail_url },
					'oembed',
				);
			}
		},
		async search(source) {
			return { searchOnly: true, candidates: [searchLink('spotify', source)] };
		},
	};
	const deezer = {
		capabilities: { catalog: true, source: true, albums: true },
		async get(ref, { signal }) {
			if (ref.short) {
				const response = await http.request(ref.url, { signal });
				const resolved = parseMusicLink(response.url);
				if (!resolved || resolved.platform !== 'deezer' || resolved.short)
					throw new ProviderError('INVALID_METADATA');
				return deezer.get(resolved, { signal });
			}
			const value = await http.get(
				`https://api.deezer.com/${ref.kind}/${ref.id}`,
				{ signal },
			);
			if (ref.kind === 'album') {
				for (let page = 0; value.tracks?.next && page < 10; page++) {
					const next = albumPage(value.tracks.next, value.id);
					const batch = await http.get(next.href, { signal });
					if (!Array.isArray(batch.data))
						throw new ProviderError('INVALID_METADATA');
					value.tracks = {
						...value.tracks,
						data: [...value.tracks.data, ...batch.data],
						next: batch.next,
					};
				}
			}
			return deezerMedia(value, ref.kind);
		},
		async search(source, { signal }) {
			const identifier = source.kind === 'track' ? source.isrc : source.upc;
			if (identifier) {
				try {
					const result = await http.get(
						`https://api.deezer.com/${source.kind}/${source.kind === 'track' ? 'isrc' : 'upc'}:${encodeURIComponent(identifier)}`,
						{ signal },
					);
					const item = deezerMedia(result, source.kind);
					if (item.isPlayable !== false) return { candidates: [item] };
				} catch (error) {
					if (error.code !== 'NOT_FOUND') throw error;
				}
			}
			const result = await http.get(
				`https://api.deezer.com/search${source.kind === 'album' ? '/album' : ''}`,
				{
					signal,
					params: { q: `${source.artist} ${source.title}`.trim(), limit: 10 },
				},
			);
			if (!Array.isArray(result?.data))
				throw new ProviderError('INVALID_METADATA');
			return enrich(result.data.slice(0, 5), (item) =>
				deezer.get(reference('deezer', source.kind, String(item.id)), {
					signal,
				}),
			);
		},
	};
	const youtubeMusic = {
		capabilities: {
			catalog: false,
			source: true,
			albums: true,
		},
		async get(ref, { signal }) {
			if (ref.kind === 'album')
				return parseYouTubeAlbum(
					await http.get(ref.url, {
						signal,
						headers: { 'User-Agent': env.METADATA_USER_AGENT || 'curl/8.7.1' },
					}),
					ref,
				);
			const value = await http.get('https://www.youtube.com/oembed', {
				signal,
				params: { url: ref.url, format: 'json' },
			});
			return media(
				ref,
				{
					title: value.title,
					artists: value.author_name
						? [value.author_name.replace(/\s*-\s*Topic$/, '')]
						: [],
					artwork: value.thumbnail_url,
				},
				'oembed',
			);
		},
		async search(source) {
			return {
				searchOnly: true,
				candidates: [searchLink('youtubeMusic', source)],
			};
		},
	};
	return { spotify, deezer, youtubeMusic };
}
