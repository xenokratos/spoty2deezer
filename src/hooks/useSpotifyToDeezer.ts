import deezerService from '../services/deezerService';
import spotifyService from '../services/spotifyService';
import type { DeezerTrack } from '../types/deezer.types';
import type { SpotifyTrack } from '../types/spotify.types';
import { parseSpotifyUrl } from '../utils/urlParser';

/**
 * Result interface for Spotify to Deezer conversions
 */
interface DeezerConversionResult {
	/** The original Spotify track information */
	spotifyTrack: SpotifyTrack;
	/** Array of matching Deezer tracks (up to 5 best matches) */
	deezerMatches: DeezerTrack[];
}

/**
 * Hook for converting Spotify tracks to Deezer matches
 *
 * @returns Object containing the convert function
 */
export const useSpotifyToDeezer = () => {
	/**
	 * Convert a Spotify URL to Deezer matches
	 *
	 * @param spotifyUrl - The Spotify track URL to convert
	 * @returns Promise resolving to conversion result with Spotify track and Deezer matches
	 * @throws Error if URL is invalid or no matches are found
	 */
	const convert = (spotifyUrl: string): Promise<DeezerConversionResult> => {
		const trackId = parseSpotifyUrl(spotifyUrl);
		if (!trackId) {
			return Promise.reject(
				new Error(
					'Invalid Spotify URL. Please check the format and try again.',
				),
			);
		}

		return spotifyService.getTrack(trackId).then((spotifyTrack) => {
			return deezerService
				.findTrackMatches(spotifyTrack)
				.then((deezerMatches) => {
					if (deezerMatches.length === 0) {
						return Promise.reject(
							new Error(
								'No matching tracks found on Deezer. Try adjusting the search terms or check if the track exists on Deezer.',
							),
						);
					}

					return { spotifyTrack, deezerMatches };
				});
		});
	};

	return { convert };
};
