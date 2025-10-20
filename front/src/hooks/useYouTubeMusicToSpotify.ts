import spotifyService from '../services/spotifyService';
import youtubeMusicService from '../services/youtubeMusicService';
import type { SpotifyAlbum, SpotifyTrack } from '../types/spotify.types';
import type { YouTubeMusicAlbum, YouTubeMusicTrack } from '../types/youtubeMusic.types';
import { parseYouTubeMusicAlbumUrl, parseYouTubeMusicUrl } from '../utils/urlParser';

/**
 * Result interface for YouTube Music to Spotify conversions
 */
interface SpotifyConversionResult {
	/** The original YouTube Music track information */
	youtubeMusicTrack?: YouTubeMusicTrack;
	/** The original YouTube Music album information */
	youtubeMusicAlbum?: YouTubeMusicAlbum;
	/** Array of matching Spotify tracks (up to 5 best matches) */
	spotifyMatches: SpotifyTrack[];
	/** Array of matching Spotify albums (up to 5 best matches) */
	spotifyAlbumMatches?: SpotifyAlbum[];
}

/**
 * Hook for converting YouTube Music tracks and albums to Spotify matches
 *
 * @returns Object containing the convert function
 */
export const useYouTubeMusicToSpotify = () => {
	/**
	 * Convert a YouTube Music URL to Spotify matches
	 *
	 * @param youtubeMusicUrl - The YouTube Music track or album URL to convert
	 * @returns Promise resolving to conversion result with YouTube Music content and Spotify matches
	 * @throws Error if URL is invalid or no matches are found
	 */
	const convert = (youtubeMusicUrl: string): Promise<SpotifyConversionResult> => {
		const trackId = parseYouTubeMusicUrl(youtubeMusicUrl);
		const albumId = parseYouTubeMusicAlbumUrl(youtubeMusicUrl);

		if (trackId) {
			// Handle track conversion
			return youtubeMusicService.getTrack(trackId).then((youtubeMusicTrack) => {
				return spotifyService.findTrackMatches(youtubeMusicTrack).then((spotifyMatches) => {
					if (spotifyMatches.length === 0) {
						return Promise.reject(
							new Error(
								'No matching tracks found on Spotify. Try adjusting the search terms or check if the track exists on Spotify.',
							),
						);
					}

					return { youtubeMusicTrack, spotifyMatches };
				});
			});
		} else if (albumId) {
			// Handle album conversion
			return youtubeMusicService.getAlbum(albumId).then((youtubeMusicAlbum) => {
				return spotifyService.findAlbumMatches(youtubeMusicAlbum).then((spotifyAlbumMatches) => {
					// For albums, we'll also try to get tracks if available
					return youtubeMusicService.getAlbumTracks(albumId).then((youtubeMusicTracks) => {
						let spotifyMatches: SpotifyTrack[] = [];

						// If we have tracks, find matches for them
						if (youtubeMusicTracks.length > 0) {
							const trackMatchPromises = youtubeMusicTracks.map((track) =>
								spotifyService.findTrackMatches(track).then((matches) => matches.slice(0, 1)),
							);

							return Promise.all(trackMatchPromises).then((trackMatchesArray) => {
								spotifyMatches = trackMatchesArray.flat();

								return {
									youtubeMusicAlbum,
									spotifyMatches,
									spotifyAlbumMatches,
								};
							});
						} else {
							return {
								youtubeMusicAlbum,
								spotifyMatches,
								spotifyAlbumMatches,
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
