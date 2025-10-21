import deezerService from '../services/deezerService';
import spotifyService from '../services/spotifyService';
import type { DeezerTrack } from '../types/deezer.types';
import type { SpotifyTrack } from '../types/spotify.types';
import { parseDeezerUrl } from '../utils/urlParser';

/**
 * Result interface for Deezer to Spotify conversions
 */
interface SpotifyConversionResult {
	/** The original Deezer track information */
	deezerTrack?: DeezerTrack;
	/** Array of matching Spotify tracks (up to 5 best matches) */
	spotifyMatches: SpotifyTrack[];
}

/**
 * Hook for converting Deezer tracks to Spotify matches
 *
 * @returns Object containing the convert function
 */
export const useDeezerToSpotify = () => {
	/**
	 * Convert a Deezer URL to Spotify matches
	 *
	 * @param deezerUrl - The Deezer track URL to convert
	 * @returns Promise resolving to conversion result with Deezer content and Spotify matches
	 */
	const convert = (deezerUrl: string): Promise<SpotifyConversionResult> => {
		const trackId = parseDeezerUrl(deezerUrl);

		if (trackId) {
			// Handle track conversion
			return deezerService.getTrack(trackId).then((deezerTrack) => {
				// Transform DeezerTrack to match SpotifyService.findTrackMatches expected format
				const transformedTrack = {
					name: deezerTrack.title,
					artists: [deezerTrack.artist],
					images: deezerTrack.cover ? [{ url: deezerTrack.cover }] : undefined,
				};

				return spotifyService
					.findTrackMatches(transformedTrack)
					.then((spotifyMatches) => {
						// Always return results, even if they're search URLs
						return { deezerTrack, spotifyMatches };
					});
			});
		} else {
			// Return a generic track that will show as "no results found"
			return Promise.resolve({
				deezerTrack: {
					id: 0,
					title: 'Invalid URL',
					artist: 'Unknown Artist',
					album: '',
					duration: 0,
					preview: '',
					link: '',
					cover: '',
				},
				spotifyMatches: [],
			});
		}
	};

	return { convert };
};
