import { parseMusicLink, reference } from '../lib/music-link.mjs';
import { ProviderError } from './errors.mjs';
import {
	deezerMedia,
	durationMs,
	media,
	parseSpotifyEmbed,
	parseYouTubeAlbum,
	spotifyMedia,
} from './metadata.mjs';
import { ResolutionPool } from './pool.mjs';

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
	let token,
		tokenExpires = 0;
	const tokenPool = new ResolutionPool({ ttlMs: 0, maxInflight: 1 });
	const spotifyConfigured = Boolean(
		env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET,
	);
	async function spotifyToken(signal) {
		if (token && tokenExpires > Date.now() + 60000) return token;
		return tokenPool.run(
			'token',
			async (sharedSignal) => {
				const value = await http.get('https://accounts.spotify.com/api/token', {
					signal: sharedSignal,
					method: 'POST',
					data: 'grant_type=client_credentials',
					headers: {
						Authorization: `Basic ${Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				});
				sharedSignal.throwIfAborted();
				if (typeof value.access_token !== 'string')
					throw new ProviderError('ACCESS_DENIED');
				token = value.access_token;
				tokenExpires = Date.now() + value.expires_in * 1000;
				return token;
			},
			{ signal },
		);
	}
	async function spotifyApi(path, { signal, params } = {}, refreshed = false) {
		const access = await spotifyToken(signal);
		try {
			return await http.get(`https://api.spotify.com/v1/${path}`, {
				signal,
				params,
				headers: { Authorization: `Bearer ${access}` },
			});
		} catch (error) {
			if (error.code !== 'AUTH_EXPIRED' || refreshed) throw error;
			token = undefined;
			tokenExpires = 0;
			return spotifyApi(path, { signal, params }, true);
		}
	}
	function albumPage(value, platform, id) {
		const url = new URL(value);
		const host = platform === 'spotify' ? 'api.spotify.com' : 'api.deezer.com';
		const path = `${platform === 'spotify' ? '/v1' : ''}/album${platform === 'spotify' ? 's' : ''}/${id}/tracks`;
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
	async function spotifyItem(kind, id, options) {
		const value = await spotifyApi(`${kind}s/${id}`, {
			...options,
			params: { market: options.market },
		});
		if (kind === 'album') {
			for (let page = 0; value.tracks?.next && page < 10; page++) {
				const next = albumPage(value.tracks.next, 'spotify', id);
				const batch = await spotifyApi(next.pathname.slice(4), {
					signal: options.signal,
					params: {
						...Object.fromEntries(next.searchParams),
						market: options.market,
					},
				});
				if (!Array.isArray(batch.items))
					throw new ProviderError('INVALID_METADATA');
				value.tracks = {
					...value.tracks,
					items: [...value.tracks.items, ...batch.items],
					next: batch.next,
				};
			}
		}
		return spotifyMedia(value, kind);
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
		capabilities: { catalog: spotifyConfigured, source: true, albums: true },
		async get(ref, { signal, market }) {
			if (spotifyConfigured) {
				try {
					return await spotifyItem(ref.kind, ref.id, { signal, market });
				} catch (error) {
					if (signal.aborted) throw error;
				}
			}
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
		async search(source, { signal, market }) {
			if (!spotifyConfigured)
				return {
					searchOnly: true,
					candidates: [searchLink('spotify', source)],
				};
			const identifier = source.kind === 'track' ? source.isrc : source.upc;
			if (identifier) {
				const data = await spotifyApi('search', {
					signal,
					params: {
						q: `${source.kind === 'track' ? 'isrc' : 'upc'}:${identifier}`,
						type: source.kind,
						market,
						limit: 10,
					},
				});
				const items = data[`${source.kind}s`]?.items;
				if (!Array.isArray(items)) throw new ProviderError('INVALID_METADATA');
				const playable = items.filter((t) => t.is_playable !== false);
				if (playable.length)
					return source.kind === 'album'
						? enrich(playable.slice(0, 3), (item) =>
								spotifyItem('album', item.id, { signal, market }),
							)
						: { candidates: playable.map((t) => spotifyMedia(t, 'track')) };
			}
			const field = source.kind === 'album' ? 'album' : 'track';
			const q = `${field}:"${source.title.replaceAll('"', '')}"${source.artist ? ` artist:"${source.artist.replaceAll('"', '')}"` : ''}`;
			const data = await spotifyApi('search', {
				signal,
				params: { q, type: source.kind, market, limit: 10 },
			});
			const items = data[`${source.kind}s`]?.items;
			if (!Array.isArray(items)) throw new ProviderError('INVALID_METADATA');
			return source.kind === 'album'
				? enrich(items.slice(0, 3), (item) =>
						spotifyItem('album', item.id, { signal, market }),
					)
				: { candidates: items.map((t) => spotifyMedia(t, 'track')) };
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
					const next = albumPage(value.tracks.next, 'deezer', value.id);
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
	function youtubeVideo(item) {
		const snippet = item.snippet;
		const channel =
			snippet?.channelTitle?.replace(/\s*-\s*Topic$/, '').trim() ?? '';
		let title = snippet?.title;
		if (
			title &&
			channel &&
			title.toLowerCase().startsWith(`${channel.toLowerCase()} - `)
		)
			title = title.slice(channel.length + 3);
		return media(reference('youtubeMusic', 'track', item.id), {
			title,
			artists: channel ? [channel] : [],
			artwork:
				snippet?.thumbnails?.high?.url ?? snippet?.thumbnails?.default?.url,
			durationMs: durationMs(item.contentDetails?.duration),
			isPlayable:
				item.status?.uploadStatus === 'processed' &&
				item.status?.privacyStatus !== 'private',
		});
	}
	const youtubeMusic = {
		capabilities: {
			catalog: Boolean(env.YOUTUBE_API_KEY),
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
			if (env.YOUTUBE_API_KEY) {
				try {
					const result = await http.get(
						'https://www.googleapis.com/youtube/v3/videos',
						{
							signal,
							params: {
								key: env.YOUTUBE_API_KEY,
								id: ref.id,
								part: 'snippet,contentDetails,status',
							},
						},
					);
					if (result.items?.[0]) return youtubeVideo(result.items[0]);
				} catch (error) {
					if (signal.aborted) throw error;
				}
			}
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
		async search(source, { signal, market }) {
			if (!env.YOUTUBE_API_KEY || source.kind === 'album')
				return {
					searchOnly: true,
					candidates: [searchLink('youtubeMusic', source)],
				};
			const search = await http.get(
				'https://www.googleapis.com/youtube/v3/search',
				{
					signal,
					params: {
						key: env.YOUTUBE_API_KEY,
						q: `${source.artist} ${source.title}`,
						type: 'video',
						part: 'snippet',
						maxResults: 5,
						regionCode: market,
						videoCategoryId: '10',
					},
				},
			);
			if (!Array.isArray(search.items))
				throw new ProviderError('INVALID_METADATA');
			const ids = search.items
				.map((i) => i.id?.videoId)
				.filter(Boolean)
				.join(',');
			if (!ids) return { candidates: [] };
			const result = await http.get(
				'https://www.googleapis.com/youtube/v3/videos',
				{
					signal,
					params: {
						key: env.YOUTUBE_API_KEY,
						id: ids,
						part: 'snippet,contentDetails,status',
					},
				},
			);
			if (!Array.isArray(result.items))
				throw new ProviderError('INVALID_METADATA');
			return {
				candidates: result.items
					.filter(
						(i) =>
							!i.contentDetails?.regionRestriction?.blocked?.includes(market) &&
							(!i.contentDetails?.regionRestriction?.allowed ||
								i.contentDetails.regionRestriction.allowed.includes(market)),
					)
					.map(youtubeVideo),
			};
		},
	};
	return { spotify, deezer, youtubeMusic };
}
