import { load } from 'cheerio';
import { ProviderError } from './errors.mjs';

export function media(ref, values, method = 'api') {
	if (typeof values.title !== 'string' || !values.title.trim())
		throw new ProviderError('INVALID_METADATA');
	const artists = (values.artists ?? [])
		.filter((a) => typeof a === 'string' && a.trim())
		.map((a) => a.trim());
	return {
		id: ref.id,
		title: values.title.trim(),
		url: ref.url,
		kind: ref.kind,
		search: false,
		quality: false,
		metadataMethod: method,
		...values,
		artists,
		artist: artists.join(', '),
	};
}
export function parseSpotifyEmbed(html, ref) {
	const $ = load(html);
	let entity;
	try {
		entity = JSON.parse($('#__NEXT_DATA__').text())?.props?.pageProps?.state
			?.data?.entity;
	} catch {
		throw new ProviderError('INVALID_METADATA');
	}
	if (entity?.uri !== `spotify:${ref.kind}:${ref.id}`)
		throw new ProviderError('INVALID_METADATA');
	const artists =
		entity.artists?.map((a) => a.name) ??
		(ref.kind === 'album' && typeof entity.subtitle === 'string'
			? [entity.subtitle]
			: []);
	const tracks = entity.trackList?.map((t) => ({
		title: t.title,
		artists: t.subtitle ? [t.subtitle] : [],
		durationMs: t.duration,
	}));
	return media(
		ref,
		{
			title: entity.name ?? entity.title,
			artists,
			artwork: entity.visualIdentity?.image?.[0]?.url,
			durationMs: entity.duration,
			releaseDate: entity.releaseDate?.isoString,
			...(tracks?.length ? { tracks, tracksComplete: false } : {}),
		},
		'embed',
	);
}
export function parseYouTubeAlbum(html, ref) {
	const $ = load(html);
	const title = $('meta[property="og:title"]').attr('content');
	const description =
		$('meta[property="og:description"]').attr('content') ?? '';
	const artist = description.split('•').slice(1).join('•').trim();
	if (
		$('meta[property="og:type"]').attr('content') !== 'music.album' ||
		!artist
	)
		throw new ProviderError('INVALID_METADATA');
	return media(
		ref,
		{
			title,
			artists: [artist],
			artwork: $('meta[property="og:image"]').attr('content'),
		},
		'html',
	);
}
export function spotifyMedia(item, kind) {
	if (!item?.id) throw new ProviderError('INVALID_METADATA');
	const ref = {
		id: item.id,
		kind,
		url: `https://open.spotify.com/${kind}/${item.id}`,
	};
	return media(ref, {
		title: item.name,
		artists: item.artists?.map((a) => a.name),
		artwork: (item.images ?? item.album?.images)?.[0]?.url,
		albumTitle: item.album?.name,
		durationMs: item.duration_ms,
		isrc: item.external_ids?.isrc,
		upc: item.external_ids?.upc,
		releaseDate: item.release_date ?? item.album?.release_date,
		trackCount: item.total_tracks,
		tracksComplete:
			Array.isArray(item.tracks?.items) &&
			!item.tracks.next &&
			item.tracks.items.length === item.total_tracks,
		isPlayable: item.is_playable,
		tracks: item.tracks?.items?.map((t) => ({
			title: t.name,
			artists: t.artists?.map((a) => a.name) ?? [],
			durationMs: t.duration_ms,
			isrc: t.external_ids?.isrc,
		})),
	});
}
export function deezerMedia(item, kind) {
	if (item?.error)
		throw new ProviderError(
			item.error.code === 800 ? 'NOT_FOUND' : 'PROVIDER_UNAVAILABLE',
		);
	if (!item?.id) throw new ProviderError('INVALID_METADATA');
	const artists =
		item.contributors?.map((a) => a.name) ??
		(item.artist?.name ? [item.artist.name] : []);
	return media(
		{
			id: String(item.id),
			kind,
			url: `https://www.deezer.com/${kind}/${item.id}`,
		},
		{
			title: item.title,
			artists,
			artwork: item.cover_medium ?? item.album?.cover_medium,
			albumTitle: item.album?.title,
			durationMs:
				kind === 'track' && Number.isFinite(item.duration)
					? item.duration * 1000
					: undefined,
			isrc: item.isrc,
			upc: item.upc,
			releaseDate: item.release_date,
			trackCount: item.nb_tracks,
			tracksComplete:
				Array.isArray(item.tracks?.data) &&
				!item.tracks.next &&
				item.tracks.data.length === item.nb_tracks,
			isPlayable: item.readable,
			tracks: item.tracks?.data?.map((t) => ({
				title: t.title,
				artists: t.artist?.name ? [t.artist.name] : artists,
				durationMs: Number.isFinite(t.duration) ? t.duration * 1000 : undefined,
				isrc: t.isrc,
			})),
		},
	);
}
export function durationMs(value) {
	const m =
		typeof value === 'string' &&
		value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
	return m
		? ((Number(m[1]) || 0) * 3600 +
				(Number(m[2]) || 0) * 60 +
				(Number(m[3]) || 0)) *
				1000
		: undefined;
}
