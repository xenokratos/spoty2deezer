import deezerService from '../services/deezerService';
import youtubeMusicService from '../services/youtubeMusicService';
import type { DeezerAlbum, DeezerTrack } from '../types/deezer.types';
import type { YouTubeMusicAlbum, YouTubeMusicTrack } from '../types/youtubeMusic.types';
import { parseYouTubeMusicAlbumUrl, parseYouTubeMusicUrl } from '../utils/urlParser';

/**
 * Result interface for YouTube Music to Deezer conversions
 */
interface DeezerConversionResult {
	/** The original YouTube Music track information */
	youtubeMusicTrack?: YouTubeMusicTrack;
	/** The original YouTube Music album information */
	youtubeMusicAlbum?: YouTubeMusicAlbum;
	/** Array of matching Deezer tracks (up to 5 best matches) */
	deezerMatches: DeezerTrack[];
	/** Array of matching Deezer albums (up to 5 best matches) */
	deezerAlbumMatches?: DeezerAlbum[];
}

/**
 * Hook for converting YouTube Music tracks and albums to Deezer matches
 *
 * @returns Object containing the convert function
 */
export const useYouTubeMusicToDeezer = () => {
	/**
	 * Convert a YouTube Music URL to Deezer matches
	 *
	 * @param youtubeMusicUrl - The YouTube Music track or album URL to convert
	 * @returns Promise resolving to conversion result with YouTube Music content and Deezer matches
	 * @throws Error if URL is invalid or no matches are found
	 */
	const convert = (youtubeMusicUrl: string): Promise<DeezerConversionResult> => {
		const trackId = parseYouTubeMusicUrl(youtubeMusicUrl);
		const albumId = parseYouTubeMusicAlbumUrl(youtubeMusicUrl);

		if (trackId) {
			// Handle track conversion
			return youtubeMusicService.getTrack(trackId).then((youtubeMusicTrack) => {
				return deezerService.findTrackMatches(youtubeMusicTrack).then((deezerMatches) => {
					if (deezerMatches.length === 0) {
						return Promise.reject(
							new Error(
								'No matching tracks found on Deezer. Try adjusting the search terms or check if the track exists on Deezer.',
							),
						);
					}

					return { youtubeMusicTrack, deezerMatches };
				});
			});
		} else if (albumId) {
			// Handle album conversion
			return youtubeMusicService.getAlbum(albumId).then((youtubeMusicAlbum) => {
				return deezerService.findAlbumMatches(youtubeMusicAlbum).then((deezerAlbumMatches) => {
					// For albums, we'll also try to get tracks if available
					return youtubeMusicService.getAlbumTracks(albumId).then((youtubeMusicTracks) => {
						let deezerMatches: DeezerTrack[] = [];

						// If we have tracks, find matches for them
						if (youtubeMusicTracks.length > 0) {
							const trackMatchPromises = youtubeMusicTracks.map((track) =>
								deezerService.findTrackMatches(track).then((matches) => matches.slice(0, 1)),
							);

							return Promise.all(trackMatchPromises).then((trackMatchesArray) => {
								deezerMatches = trackMatchesArray.flat();

								return {
									youtubeMusicAlbum,
									deezerMatches,
									deezerAlbumMatches,
								};
							});
						} else {
							return {
								youtubeMusicAlbum,
								deezerMatches,
								deezerAlbumMatches,
							};
						}
					});
				});
			});
		} else {
			return Promise.reject(
				new Error('Invalid YouTube Music URL. Please check the format and try again.'),
			);
		}
	};

	return { convert };
};
