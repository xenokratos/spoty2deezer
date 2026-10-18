import type { Media, Resolution } from '../../../back/lib/contract';
import { platforms } from '../../../back/lib/music-link.mjs';

const statuses = [
	'identifier_match',
	'likely_match',
	'search_link',
	'no_match',
	'provider_unavailable',
];
function object(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
function link(value: unknown): boolean {
	if (typeof value !== 'string') return false;
	try {
		const url = new URL(value);
		return (
			url.protocol === 'https:' &&
			!url.username &&
			!url.password &&
			[
				'open.spotify.com',
				'www.deezer.com',
				'deezer.com',
				'music.youtube.com',
				'www.youtube.com',
			].includes(url.hostname)
		);
	} catch {
		return false;
	}
}
function media(value: unknown): value is Media {
	return (
		object(value) &&
		typeof value.id === 'string' &&
		typeof value.title === 'string' &&
		typeof value.artist === 'string' &&
		(value.kind === 'track' || value.kind === 'album') &&
		typeof value.search === 'boolean' &&
		typeof value.quality === 'boolean' &&
		link(value.url) &&
		(value.artwork === undefined || typeof value.artwork === 'string') &&
		(value.albumTitle === undefined || typeof value.albumTitle === 'string') &&
		(value.trackCount === undefined || typeof value.trackCount === 'number')
	);
}
export function isResolution(value: unknown): value is Resolution {
	if (
		!object(value) ||
		value.schemaVersion !== 1 ||
		typeof value.market !== 'string' ||
		!/^[A-Z]{2}$/.test(value.market) ||
		!platforms.includes(value.platform as never) ||
		!media(value.source) ||
		value.source.search ||
		!Array.isArray(value.destinations) ||
		value.destinations.length !== 2
	)
		return false;
	const seen = new Set();
	return value.destinations.every((d) => {
		if (
			!object(d) ||
			!platforms.includes(d.platform as never) ||
			d.platform === value.platform ||
			seen.has(d.platform) ||
			!statuses.includes(d.status as string) ||
			typeof d.failed !== 'boolean' ||
			(d.partial !== undefined && typeof d.partial !== 'boolean') ||
			d.failed !== (d.status === 'provider_unavailable') ||
			!Array.isArray(d.matches) ||
			d.matches.length > 5 ||
			!d.matches.every(media)
		)
			return false;
		seen.add(d.platform);
		return true;
	});
}
