import deezerService from '../services/deezerService';
import youtubeMusicService from '../services/youtubeMusicService';
import type { DeezerTrack } from '../types/deezer.types';
import type { YouTubeMusicTrack } from '../types/youtubeMusic.types';
import { parseDeezerUrl } from '../utils/urlParser';

/**
 * Result interface for Deezer to YouTube Music conversions
 */
interface DeezerToYouTubeMusicResult {
	/** The original Deezer track information */
	deezerTrack: DeezerTrack;
	/** Array of YouTube Music search links */
	youtubeMatches: YouTubeMusicTrack[];
}

/**
 * Hook for converting Deezer tracks to YouTube Music search links
 *
 * @returns Object containing the convert function
 */
export const useDeezerToYouTubeMusic = () => {
	/**
	 * Convert a Deezer URL to YouTube Music search links
	 *
	 * @param deezerUrl - The Deezer track URL to convert
	 * @returns Promise resolving to conversion result with Deezer track and YouTube Music search links
	 * @throws Error if URL is invalid or no search links can be generated
	 */
	const convert = (deezerUrl: string): Promise<DeezerToYouTubeMusicResult> => {
		const trackId = parseDeezerUrl(deezerUrl);
		if (!trackId) {
			return Promise.reject(
				new Error('Invalid Deezer URL. Please check the format and try again.'),
			);
		}

		return deezerService.getTrack(trackId).then((deezerTrack) => {
			return youtubeMusicService
				.findTrackMatches({
					name: deezerTrack.title,
					artists: [deezerTrack.artist],
					images: [{ url: deezerTrack.cover }],
				})
				.then((youtubeMatches) => {
					return { deezerTrack, youtubeMatches };
				});
		});
	};

	return { convert };
};
