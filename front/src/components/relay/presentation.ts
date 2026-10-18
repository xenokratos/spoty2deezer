import type {
	PlatformType,
	SourceAlbum,
	SourceTrack,
} from '../../types/converter.types';
import {
	detectPlatform,
	parseYouTubeMusicAlbumUrl,
	parseYouTubeMusicUrl,
} from '../../utils/urlParser.ts';

export interface Media {
	id: string;
	title: string;
	artist: string;
	artwork?: string;
	url: string;
	kind: 'track' | 'album';
	search: boolean;
	quality: boolean;
	trackCount?: number;
	albumTitle?: string;
}

export interface Destination {
	platform: PlatformType;
	matches: Media[];
	failed: boolean;
}

export interface Results {
	source: Media;
	platform: PlatformType;
	destinations: Destination[];
}

export const platforms: PlatformType[] = ['spotify', 'deezer', 'youtubeMusic'];
export const platformNames = {
	spotify: 'Spotify',
	deezer: 'Deezer',
	youtubeMusic: 'YouTube Music',
};

export function supportedPlatform(input: string): PlatformType | null {
	const value = input.trim();
	const platform = detectPlatform(value);
	if (
		!platform ||
		(platform === 'youtubeMusic' &&
			!parseYouTubeMusicUrl(value) &&
			!parseYouTubeMusicAlbumUrl(value))
	)
		return null;
	if (value.startsWith('spotify:')) return platform;
	try {
		const url = new URL(value.startsWith('http') ? value : `https://${value}`);
		const hosts = [
			'open.spotify.com',
			'spotify.com',
			'www.deezer.com',
			'deezer.com',
			'link.deezer.com',
			'music.youtube.com',
			'www.youtube.com',
			'youtube.com',
			'm.youtube.com',
		];
		return ['https:', 'http:'].includes(url.protocol) &&
			hosts.includes(url.hostname)
			? platform
			: null;
	} catch {
		return null;
	}
}

export function safeLink(value: string): string {
	try {
		const url = new URL(value);
		return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
	} catch {
		return '';
	}
}

export function embedPreview(
	media: Media,
	platform: PlatformType,
): string | null {
	if (media.search) return null;
	try {
		const url = new URL(media.url);
		if (url.protocol !== 'https:') return null;
		if (platform === 'spotify' && url.hostname === 'open.spotify.com') {
			const match = url.pathname.match(
				/^\/(track|album)\/([a-zA-Z0-9]{22})\/?$/,
			);
			return match
				? `https://open.spotify.com/embed/${match[1]}/${match[2]}`
				: null;
		}
		if (
			platform === 'deezer' &&
			['deezer.com', 'www.deezer.com'].includes(url.hostname)
		) {
			const match = url.pathname.match(
				/^\/(?:[a-z]{2}\/)?(track|album)\/(\d+)\/?$/,
			);
			return match
				? `https://widget.deezer.com/widget/light/${match[1]}/${match[2]}`
				: null;
		}
		if (
			platform === 'youtubeMusic' &&
			[
				'music.youtube.com',
				'www.youtube.com',
				'youtube.com',
				'm.youtube.com',
			].includes(url.hostname) &&
			['/watch', '/playlist'].includes(url.pathname)
		) {
			const album = parseYouTubeMusicAlbumUrl(media.url);
			if (album)
				return `https://www.youtube-nocookie.com/embed/videoseries?list=${album}`;
			const id = url.searchParams.get('v');
			return id && /^[a-zA-Z0-9_-]{11}$/.test(id)
				? `https://www.youtube-nocookie.com/embed/${id}`
				: null;
		}
	} catch {
		return null;
	}
	return null;
}

export function manualSearch(platform: PlatformType, source: Media): string {
	const query = encodeURIComponent(`${source.artist} ${source.title}`);
	return {
		spotify: `https://open.spotify.com/search/${query}`,
		deezer: `https://www.deezer.com/search/${query}`,
		youtubeMusic: `https://music.youtube.com/search?q=${query}`,
	}[platform];
}

export function presentMedia(
	item: SourceTrack | SourceAlbum,
	kind: Media['kind'] = 'track',
): Media {
	const deezer = 'title' in item;
	const url = safeLink(
		deezer
			? item.link
			: 'channel' in item
				? item.url
				: item.external_urls.spotify,
	);
	return {
		id: String(item.id),
		title: deezer ? item.title : item.name,
		artist: deezer ? item.artist : item.artists.join(', '),
		artwork: deezer ? item.cover : item.images?.[0]?.url,
		url,
		kind,
		search: /\/(search|results)([/?#]|$)/.test(url),
		quality: item.isHighQuality !== false,
		trackCount: 'total_tracks' in item ? item.total_tracks : undefined,
		albumTitle: 'album' in item ? item.album : undefined,
	};
}
