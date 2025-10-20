import deezerService from "../services/deezerService";
import youtubeMusicService from "../services/youtubeMusicService";
import type { DeezerTrack } from "../types/deezer.types";
import type { YouTubeMusicTrack } from "../types/youtubeMusic.types";
import { parseYouTubeMusicUrl } from "../utils/urlParser";

/**
 * Result interface for YouTube Music to Deezer conversions
 */
interface DeezerConversionResult {
	/** The original YouTube Music track information */
	youtubeMusicTrack?: YouTubeMusicTrack;
	/** Array of matching Deezer tracks (up to 5 best matches) */
	deezerMatches: DeezerTrack[];
}

/**
 * Hook for converting YouTube Music tracks to Deezer matches
 *
 * @returns Object containing the convert function
 */
export const useYouTubeMusicToDeezer = () => {
	/**
	 * Convert a YouTube Music URL to Deezer matches
	 *
	 * @param youtubeMusicUrl - The YouTube Music track URL to convert
	 * @returns Promise resolving to conversion result with YouTube Music content and Deezer matches
	 */
	const convert = (
		youtubeMusicUrl: string,
	): Promise<DeezerConversionResult> => {
		const trackId = parseYouTubeMusicUrl(youtubeMusicUrl);

		if (trackId) {
			// Handle track conversion
			return youtubeMusicService.getTrack(trackId).then((youtubeMusicTrack) => {
				return deezerService
					.findTrackMatches(youtubeMusicTrack)
					.then((deezerMatches) => {
						// Always return results, even if they're explore-more results
						return { youtubeMusicTrack, deezerMatches };
					});
			});
		} else {
			// Return a generic track that will show as "no results found"
			return Promise.resolve({
				youtubeMusicTrack: {
					id: "invalid",
					name: "Invalid URL",
					artists: ["Unknown"],
					channel: "Unknown",
					url: "",
					thumbnail: "",
					images: [],
					external_urls: { youtube: "" },
				},
				deezerMatches: [],
			});
		}
	};

	return { convert };
};
