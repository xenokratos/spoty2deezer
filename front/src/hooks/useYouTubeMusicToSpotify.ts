import spotifyService from '../services/spotifyService';
import youtubeMusicService from '../services/youtubeMusicService';
import type { SpotifyTrack } from '../types/spotify.types';
import type { YouTubeMusicTrack } from '../types/youtubeMusic.types';
import { parseYouTubeMusicUrl } from '../utils/urlParser';

/**
 * Result interface for YouTube Music to Spotify conversions
 */
interface SpotifyConversionResult {
	/** The original YouTube Music track information */
	youtubeMusicTrack?: YouTubeMusicTrack;
	/** Array of matching Spotify tracks (up to 5 best matches) */
	spotifyMatches: SpotifyTrack[];
}

/**
 * Hook for converting YouTube Music tracks to Spotify matches
 *
 * @returns Object containing the convert function
 */
export const useYouTubeMusicToSpotify = () => {
	/**
	 * Convert a YouTube Music URL to Spotify matches
	 *
	 * @param youtubeMusicUrl - The YouTube Music track URL to convert
	 * @returns Promise resolving to conversion result with YouTube Music content and Spotify matches
	 */
	const convert = (
		youtubeMusicUrl: string,
	): Promise<SpotifyConversionResult> => {
		const trackId = parseYouTubeMusicUrl(youtubeMusicUrl);

		if (trackId) {
			// Handle track conversion
			return youtubeMusicService.getTrack(trackId).then((youtubeMusicTrack) => {
				return spotifyService
					.findTrackMatches(youtubeMusicTrack)
					.then((spotifyMatches) => {
						// Always return results, even if they're search URLs
						return { youtubeMusicTrack, spotifyMatches };
					});
			});
		} else {
			// Return a generic track that will show as "no results found"
			return Promise.resolve({
				youtubeMusicTrack: {
					id: 'invalid',
					name: 'Invalid URL',
					artists: ['Unknown'],
					channel: 'Unknown',
					url: '',
					thumbnail: '',
					images: [],
					external_urls: { youtube: '' },
				},
				spotifyMatches: [],
			});
		}
	};

	return { convert };
};
