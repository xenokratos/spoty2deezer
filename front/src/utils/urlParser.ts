/**
 * URL Parser for Spotify and Deezer links
 * Supports various URL formats for both platforms
 */

export type PlatformType = 'spotify' | 'deezer' | 'youtubeMusic' | null;

/**
 * Extracts the track ID from a Spotify URL or URI
 * Supports:
 * - https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
 * - https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=...
 * - spotify:track:4iV5W9uYEdYUVa79Axb7Rh
 * @param url - The Spotify URL or URI to parse
 * @returns The track ID if found, null otherwise
 */
export function parseSpotifyUrl(url: string | null | undefined): string | null {
	if (!url) return null;

	// Remove whitespace
	const trimmedUrl = url.trim();

	// Handle Spotify URI format (spotify:track:id)
	const uriMatch = trimmedUrl.match(/spotify:track:([a-zA-Z0-9]+)/);
	if (uriMatch?.[1]) {
		return uriMatch[1];
	}

	// Handle HTTP/HTTPS URLs
	const urlMatch = trimmedUrl.match(
		/(?:https?:\/\/)?(?:open\.)?spotify\.com\/track\/([a-zA-Z0-9]+)/,
	);
	if (urlMatch?.[1]) {
		return urlMatch[1];
	}

	return null;
}

/**
 * Extracts the album ID from a Spotify URL or URI
 * Supports:
 * - https://open.spotify.com/album/15FZlljjgimILw4hn7urFj
 * - https://open.spotify.com/album/15FZlljjgimILw4hn7urFj?si=...
 * - spotify:album:15FZlljjgimILw4hn7urFj
 * @param url - The Spotify URL or URI to parse
 * @returns The album ID if found, null otherwise
 */
export function parseSpotifyAlbumUrl(
	url: string | null | undefined,
): string | null {
	if (!url) return null;

	// Remove whitespace
	const trimmedUrl = url.trim();

	// Handle Spotify URI format (spotify:album:id)
	const uriMatch = trimmedUrl.match(/spotify:album:([a-zA-Z0-9]+)/);
	if (uriMatch?.[1]) {
		return uriMatch[1];
	}

	// Handle HTTP/HTTPS URLs
	const urlMatch = trimmedUrl.match(
		/(?:https?:\/\/)?(?:open\.)?spotify\.com\/album\/([a-zA-Z0-9]+)/,
	);
	if (urlMatch?.[1]) {
		return urlMatch[1];
	}

	return null;
}

/**
 * Extracts the track ID from a YouTube Music URL
 * Supports:
 * - https://music.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ (standard YouTube link for music)
 * - https://m.youtube.com/watch?v=dQw4w9WgXcQ
 * @param url - The YouTube Music URL to parse
 * @returns The track ID if found, null otherwise
 */
export function parseYouTubeMusicUrl(
	url: string | null | undefined,
): string | null {
	if (!url) return null;

	const trimmedUrl = url.trim();

	// Handle YouTube Music track URLs (music.youtube.com/watch?v=...)
	const musicUrlMatch = trimmedUrl.match(
		/(?:https?:\/\/)?(?:music\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
	);
	if (musicUrlMatch?.[1]) {
		return musicUrlMatch[1];
	}

	// Handle standard YouTube track URLs that might be music (www.youtube.com/watch?v=...)
	const standardUrlMatch = trimmedUrl.match(
		/(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
	);
	if (standardUrlMatch?.[1]) {
		return standardUrlMatch[1];
	}

	return null;
}

/**
 * Extracts the album ID from a YouTube Music URL
 * Supports:
 * - https://music.youtube.com/playlist?list=OLAK5uy_kQy9r-i2-...
 * @param url - The YouTube Music URL to parse
 * @returns The album ID if found, null otherwise
 */
export function parseYouTubeMusicAlbumUrl(
	url: string | null | undefined,
): string | null {
	if (!url) return null;

	const trimmedUrl = url.trim();

	// Handle YouTube Music playlist/album URLs
	const albumUrlMatch = trimmedUrl.match(
		/(?:https?:\/\/)?(?:music\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
	);
	if (albumUrlMatch?.[1]) {
		return albumUrlMatch[1];
	}

	return null;
}

/**
 * Extracts the track ID from a Deezer URL
 * Supports:
 * - https://www.deezer.com/track/123456789
 * - https://deezer.com/track/123456789
 * - https://www.deezer.com/en/track/123456789
 * - https://link.deezer.com/s/{shortCode}
 * @param url - The Deezer URL to parse
 * @returns The track ID if found, null otherwise
 */
export function parseDeezerUrl(url: string | null | undefined): string | null {
	if (!url) return null;

	// Remove whitespace
	const trimmedUrl = url.trim();

	// Handle direct track URLs
	// Matches: deezer.com/track/{id} or deezer.com/{lang}/track/{id}
	const urlMatch = trimmedUrl.match(
		/(?:https?:\/\/)?(?:www\.)?deezer\.com(?:\/[a-z]{2})?\/track\/(\d+)/,
	);
	if (urlMatch?.[1]) {
		return urlMatch[1];
	}

	// Handle shortened Deezer links: link.deezer.com/s/{shortCode}
	const shortMatch = trimmedUrl.match(
		/(?:https?:\/\/)?link\.deezer\.com\/s\/([a-zA-Z0-9]+)/,
	);
	if (shortMatch?.[1]) {
		return `short:${shortMatch[1]}`;
	}

	return null;
}

/**
 * Detects which platform a URL belongs to
 * @param url - The URL to detect
 * @returns The platform type or null if not recognized
 */
export function detectPlatform(url: string | null | undefined): PlatformType {
	if (!url) return null;

	const trimmedUrl = url.trim();

	// Check Spotify
	if (trimmedUrl.includes('spotify.com') || trimmedUrl.startsWith('spotify:')) {
		return parseSpotifyUrl(trimmedUrl) || parseSpotifyAlbumUrl(trimmedUrl)
			? 'spotify'
			: null;
	}

	// Check Deezer
	if (
		trimmedUrl.includes('deezer.com') ||
		trimmedUrl.includes('link.deezer.com')
	) {
		return parseDeezerUrl(trimmedUrl) ? 'deezer' : null;
	}

	// Check YouTube Music
	if (
		trimmedUrl.includes('youtube.com') ||
		trimmedUrl.includes('music.youtube.com')
	) {
		return parseYouTubeMusicUrl(trimmedUrl) ||
			parseYouTubeMusicAlbumUrl(trimmedUrl)
			? 'youtubeMusic'
			: null;
	}

	return null;
}

/**
 * Validates if a string is a valid Spotify URL or URI
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidSpotifyUrl(url: string | null | undefined): boolean {
	return parseSpotifyUrl(url) !== null || parseSpotifyAlbumUrl(url) !== null;
}

/**
 * Validates if a string is a valid Deezer URL
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidDeezerUrl(url: string | null | undefined): boolean {
	return parseDeezerUrl(url) !== null;
}

/**
 * Validates if a string is a valid YouTube Music URL
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidYouTubeMusicUrl(
	url: string | null | undefined,
): boolean {
	return (
		parseYouTubeMusicUrl(url) !== null ||
		parseYouTubeMusicAlbumUrl(url) !== null
	);
}

/**
 * Validates if a string is a valid URL from any supported platform
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidMusicUrl(url: string | null | undefined): boolean {
	return detectPlatform(url) !== null;
}
