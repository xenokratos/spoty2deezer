import type { Media } from '../../../../back/lib/contract';
import {
	type Platform as PlatformType,
	parseMusicLink,
	platforms,
} from '../../../../back/lib/music-link.mjs';

export type {
	Destination,
	Media,
	Resolution as Results,
} from '../../../../back/lib/contract';
export { platforms };

export const platformNames = {
	spotify: 'Spotify',
	deezer: 'Deezer',
	youtubeMusic: 'YouTube Music',
};

export function supportedPlatform(input: string): PlatformType | null {
	return parseMusicLink(input)?.platform ?? null;
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
			const album =
				parseMusicLink(media.url)?.kind === 'album'
					? parseMusicLink(media.url)?.id
					: null;
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
