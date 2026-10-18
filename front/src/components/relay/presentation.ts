import type {
	PlatformType,
	SourceAlbum,
	SourceTrack,
} from '../../types/converter.types';
import { detectPlatform, parseYouTubeMusicUrl } from '../../utils/urlParser.ts';

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
		(platform === 'youtubeMusic' && !parseYouTubeMusicUrl(value))
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
