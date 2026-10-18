import deezerService from '../services/deezerService';
import youtubeMusicService from '../services/youtubeMusicService';
import type { DeezerAlbum, DeezerTrack } from '../types/deezer.types';
import type {
	YouTubeMusicAlbum,
	YouTubeMusicTrack,
} from '../types/youtubeMusic.types';
import {
	parseYouTubeMusicAlbumUrl,
	parseYouTubeMusicUrl,
} from '../utils/urlParser';

interface ConversionResult {
	youtubeMusicTrack?: YouTubeMusicTrack;
	youtubeMusicAlbum?: YouTubeMusicAlbum;
	deezerMatches: (DeezerTrack | DeezerAlbum)[];
}

export const useYouTubeMusicToDeezer = () => {
	const convert = async (url: string): Promise<ConversionResult> => {
		const trackId = parseYouTubeMusicUrl(url);
		if (trackId) {
			const youtubeMusicTrack = await youtubeMusicService.getTrack(trackId);
			return {
				youtubeMusicTrack,
				deezerMatches: await deezerService.findTrackMatches(youtubeMusicTrack),
			};
		}
		const albumId = parseYouTubeMusicAlbumUrl(url);
		if (albumId) {
			const youtubeMusicAlbum = await youtubeMusicService.getAlbum(albumId);
			return {
				youtubeMusicAlbum,
				deezerMatches: await deezerService.findAlbumMatches(youtubeMusicAlbum),
			};
		}
		throw new Error('Unsupported YouTube Music URL');
	};
	return { convert };
};
