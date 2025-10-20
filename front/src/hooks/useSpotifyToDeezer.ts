import deezerService from "../services/deezerService";
import spotifyService from "../services/spotifyService";
import type { DeezerAlbum, DeezerTrack } from "../types/deezer.types";
import type { SpotifyAlbum, SpotifyTrack } from "../types/spotify.types";
import { parseSpotifyAlbumUrl, parseSpotifyUrl } from "../utils/urlParser";

/**
 * Result interface for Spotify to Deezer conversions
 */
interface DeezerConversionResult {
	/** The original Spotify track information */
	spotifyTrack?: SpotifyTrack;
	/** The original Spotify album information */
	spotifyAlbum?: SpotifyAlbum;
	/** Array of matching Deezer tracks (up to 5 best matches) */
	deezerMatches: DeezerTrack[];
	/** Array of matching Deezer albums (up to 5 best matches) */
	deezerAlbumMatches?: DeezerAlbum[];
}

/**
 * Hook for converting Spotify tracks and albums to Deezer matches
 *
 * @returns Object containing the convert function
 */
export const useSpotifyToDeezer = () => {
	/**
	 * Convert a Spotify URL to Deezer matches
	 *
	 * @param spotifyUrl - The Spotify track or album URL to convert
	 * @returns Promise resolving to conversion result with Spotify content and Deezer matches
	 * @throws Error if URL is invalid or no matches are found
	 */
	const convert = (spotifyUrl: string): Promise<DeezerConversionResult> => {
		const trackId = parseSpotifyUrl(spotifyUrl);
		const albumId = parseSpotifyAlbumUrl(spotifyUrl);

		if (trackId) {
			// Handle track conversion
			return spotifyService.getTrack(trackId).then((spotifyTrack) => {
				return deezerService
					.findTrackMatches(spotifyTrack)
					.then((deezerMatches) => {
						if (deezerMatches.length === 0) {
							return Promise.reject(
								new Error(
									"No matching tracks found on Deezer. Try adjusting the search terms or check if the track exists on Deezer.",
								),
							);
						}

						return { spotifyTrack, deezerMatches };
					});
			});
		} else if (albumId) {
			// Handle album conversion
			return spotifyService.getAlbum(albumId).then((spotifyAlbum) => {
				return deezerService
					.findAlbumMatches(spotifyAlbum)
					.then((deezerAlbumMatches) => {
						// For albums, we'll also try to get tracks if available
						return spotifyService
							.getAlbumTracks(albumId)
							.then((spotifyTracks) => {
								let deezerMatches: DeezerTrack[] = [];

								// If we have tracks, find matches for them
								if (spotifyTracks.length > 0) {
									const trackMatchPromises = spotifyTracks.map((track) =>
										deezerService
											.findTrackMatches(track)
											.then((matches) => matches.slice(0, 1)),
									);

									return Promise.all(trackMatchPromises).then(
										(trackMatchesArray) => {
											deezerMatches = trackMatchesArray.flat();

											return {
												spotifyAlbum,
												deezerMatches,
												deezerAlbumMatches,
											};
										},
									);
								} else {
									return {
										spotifyAlbum,
										deezerMatches,
										deezerAlbumMatches,
									};
								}
							});
					});
			});
		} else {
			return Promise.reject(
				new Error(
					"Invalid Spotify URL. Please check the format and try again.",
				),
			);
		}
	};

	return { convert };
};
