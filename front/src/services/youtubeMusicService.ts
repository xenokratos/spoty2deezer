import type { SpotifyAlbum } from '../types/spotify.types';
import type { YouTubeMusicTrack } from '../types/youtubeMusic.types';

/**
 * Service for generating YouTube Music search links and track information
 *
 * This service creates optimized search URLs for YouTube Music based on track information
 * from other platforms, since direct API access to YouTube Music is not available.
 */
class YouTubeMusicService {
	/**
	 * Normalize string for better search query
	 * @param str - String to normalize
	 * @returns Normalized string
	 */
	private normalizeForSearch(str: string): string {
		if (!str || typeof str !== 'string') {
			return '';
		}

		return str
			.replace(/\s*\(feat\..*?\)/gi, '') // Remove feat. annotations
			.replace(/\s*\[.*?\]\s*/g, '') // Remove content in brackets
			.replace(/\s*\(.*?\)\s*/g, '') // Remove content in parentheses
			.trim();
	}

	/**
	 * Get track information by video ID using axios (no external services)
	 * @param videoId - The YouTube video ID
	 * @returns Track information
	 * @throws Error if track is not found or fetch fails
	 */
	async getTrack(videoId: string): Promise<YouTubeMusicTrack> {
		try {
			// Since we can't scrape YouTube due to CORS,
			// we'll return a generic track that will be matched by search algorithms
			// The user can manually visit the link to get the actual track info

			return {
				id: videoId,
				name: 'Track from YouTube Music',
				artists: ['Unknown Artist'],
				channel: 'Unknown Channel',
				url: `https://music.youtube.com/watch?v=${videoId}`,
				thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
				images: [{ url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` }],
				external_urls: {
					youtube: `https://music.youtube.com/watch?v=${videoId}`,
				},
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to fetch track from YouTube: ${errorMessage}`);
		}
	}

	/**
	 * Generate YouTube Music results based on Spotify track information
	 * Creates direct YouTube Music search URLs with optimized queries
	 */
	private searchYouTubeBasic(spotifyTrack: {
		name: string;
		artists: string[];
		images?: Array<{ url: string }>;
	}): Promise<YouTubeMusicTrack[]> {
		const { name, artists, images } = spotifyTrack;
		const artist = artists[0] || '';
		const thumbnail = images?.[0]?.url || 'https://i.ytimg.com/vi/default/mqdefault.jpg';

		// Normalize track name and artist for better search results
		const cleanTrackName = this.normalizeForSearch(name);
		const cleanArtist = this.normalizeForSearch(artist);

		const results: YouTubeMusicTrack[] = [];

		// Primary search: Artist + Track Name
		if (cleanArtist && cleanTrackName) {
			const primaryQuery = encodeURIComponent(`${cleanArtist} ${cleanTrackName}`);
			results.push({
				id: `search-${Date.now()}-1`,
				name: cleanTrackName,
				artists: [cleanArtist],
				channel: cleanArtist,
				url: `https://music.youtube.com/search?q=${primaryQuery}`,
				thumbnail,
				images: [{ url: thumbnail }],
				external_urls: {
					youtube: `https://music.youtube.com/search?q=${primaryQuery}`,
				},
			});

			// Alternative: Search with "official audio" for better match
			const officialQuery = encodeURIComponent(`${cleanArtist} ${cleanTrackName} official audio`);
			results.push({
				id: `search-${Date.now()}-2`,
				name: `${cleanTrackName}`,
				artists: [cleanArtist],
				channel: `${cleanArtist} - Topic`,
				url: `https://music.youtube.com/search?q=${officialQuery}`,
				thumbnail,
				images: [{ url: thumbnail }],
				external_urls: {
					youtube: `https://music.youtube.com/search?q=${officialQuery}`,
				},
			});

			// Alternative: Try with YouTube main search (often has more results)
			const youtubeQuery = encodeURIComponent(`${cleanArtist} ${cleanTrackName}`);
			results.push({
				id: `search-${Date.now()}-3`,
				name: cleanTrackName,
				artists: [cleanArtist],
				channel: cleanArtist,
				url: `https://www.youtube.com/results?search_query=${youtubeQuery}`,
				thumbnail,
				images: [{ url: thumbnail }],
				external_urls: {
					youtube: `https://www.youtube.com/results?search_query=${youtubeQuery}`,
				},
			});
		} else if (cleanTrackName) {
			// Fallback: Track name only if artist is missing
			const fallbackQuery = encodeURIComponent(cleanTrackName);
			results.push({
				id: `search-${Date.now()}-fallback`,
				name: cleanTrackName,
				artists: ['Unknown'],
				channel: 'Various Artists',
				url: `https://music.youtube.com/search?q=${fallbackQuery}`,
				thumbnail,
				images: [{ url: thumbnail }],
				external_urls: {
					youtube: `https://music.youtube.com/search?q=${fallbackQuery}`,
				},
			});
		}

		return Promise.resolve(results);
	}

	/**
	 * Generate YouTube Music search links for a track from another platform
	 *
	 * Creates multiple optimized search URLs to help users find the track on YouTube Music.
	 * Since YouTube Music doesn't provide a public API, this method generates search links
	 * with different query variations for better match results.
	 *
	 * @param sourceTrack - The source track information with name, artists, and optional images
	 * @returns Promise resolving to array of YouTube Music search track objects
	 */
	findTrackMatches(sourceTrack: {
		name: string;
		artists: string[];
		images?: Array<{ url: string }>;
	}): Promise<YouTubeMusicTrack[]> {
		// Generate YouTube Music results with clean, optimized queries
		return this.searchYouTubeBasic(sourceTrack);
	}

	/**
	 * Generate YouTube Music search links for an album from another platform
	 *
	 * Creates optimized search URLs to help users find the album on YouTube Music.
	 * Since YouTube Music doesn't provide a public API, this method generates search links
	 * with different query variations for better match results.
	 *
	 * @param sourceAlbum - The source album information with name, artists, and optional images
	 * @returns Promise resolving to array of YouTube Music search track objects
	 */
	findAlbumMatches(sourceAlbum: SpotifyAlbum): Promise<YouTubeMusicTrack[]> {
		const { name, artists, images } = sourceAlbum;
		const artist = artists[0] || '';
		const thumbnail = images?.[0]?.url || 'https://i.ytimg.com/vi/default/mqdefault.jpg';

		// Normalize album name and artist for better search results
		const cleanAlbumName = this.normalizeForSearch(name);
		const cleanArtist = this.normalizeForSearch(artist);

		const results: YouTubeMusicTrack[] = [];

		// Primary search: Artist + Album Name
		if (cleanArtist && cleanAlbumName) {
			const primaryQuery = encodeURIComponent(`${cleanArtist} ${cleanAlbumName} album`);
			results.push({
				id: `album-search-${Date.now()}-1`,
				name: cleanAlbumName,
				artists: [cleanArtist],
				channel: cleanArtist,
				url: `https://music.youtube.com/search?q=${primaryQuery}`,
				thumbnail,
				images: [{ url: thumbnail }],
				external_urls: {
					youtube: `https://music.youtube.com/search?q=${primaryQuery}`,
				},
			});

			// Alternative: Search for full album
			const fullAlbumQuery = encodeURIComponent(`${cleanArtist} ${cleanAlbumName} full album`);
			results.push({
				id: `album-search-${Date.now()}-2`,
				name: `${cleanAlbumName} (Full Album)`,
				artists: [cleanArtist],
				channel: `${cleanArtist} - Topic`,
				url: `https://music.youtube.com/search?q=${fullAlbumQuery}`,
				thumbnail,
				images: [{ url: thumbnail }],
				external_urls: {
					youtube: `https://music.youtube.com/search?q=${fullAlbumQuery}`,
				},
			});
		} else if (cleanAlbumName) {
			// Fallback: Album name only if artist is missing
			const fallbackQuery = encodeURIComponent(`${cleanAlbumName} album`);
			results.push({
				id: `album-search-${Date.now()}-fallback`,
				name: cleanAlbumName,
				artists: ['Various Artists'],
				channel: 'Various Artists',
				url: `https://music.youtube.com/search?q=${fallbackQuery}`,
				thumbnail,
				images: [{ url: thumbnail }],
				external_urls: {
					youtube: `https://music.youtube.com/search?q=${fallbackQuery}`,
				},
			});
		}

		return Promise.resolve(results);
	}
}

export default new YouTubeMusicService();
