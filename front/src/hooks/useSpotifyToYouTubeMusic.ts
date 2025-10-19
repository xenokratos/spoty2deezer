import spotifyService from '../services/spotifyService';
import youtubeMusicService from '../services/youtubeMusicService';
import type { SpotifyTrack } from '../types/spotify.types';
import type { YouTubeMusicTrack } from '../types/youtubeMusic.types';
import { parseSpotifyUrl } from '../utils/urlParser';

/**
 * Result interface for Spotify to YouTube Music conversions
 */
interface YouTubeMusicConversionResult {
	/** The original Spotify track information */
	spotifyTrack: SpotifyTrack;
	/** Array of YouTube Music search links */
	youtubeMatches: YouTubeMusicTrack[];
}

/**
 * Hook for converting Spotify tracks to YouTube Music search links
 *
 * @returns Object containing the convert function
 */
export const useSpotifyToYouTubeMusic = () => {
	/**
	 * Convert a Spotify URL to YouTube Music search links
	 *
	 * @param spotifyUrl - The Spotify track URL to convert
	 * @returns Promise resolving to conversion result with Spotify track and YouTube Music search links
	 * @throws Error if URL is invalid or no search links can be generated
	 */
	const convert = (
		spotifyUrl: string,
	): Promise<YouTubeMusicConversionResult> => {
		const trackId = parseSpotifyUrl(spotifyUrl);
		if (!trackId) {
			return Promise.reject(
				new Error(
					'Invalid Spotify URL. Please check the format and try again.',
				),
			);
		}

		return spotifyService.getTrack(trackId).then((spotifyTrack) => {
			return youtubeMusicService
				.findTrackMatches(spotifyTrack)
				.then((youtubeMatches: YouTubeMusicTrack[]) => {
					if (youtubeMatches.length === 0) {
						return Promise.reject(
							new Error(
								'No matching tracks found on YouTube Music. Try searching manually with the track details.',
							),
						);
					}

					return { spotifyTrack, youtubeMatches };
				});
		});
	};

	return { convert };
};
