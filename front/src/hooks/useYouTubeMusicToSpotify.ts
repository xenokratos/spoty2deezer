import spotifyService from '../services/spotifyService';
import youtubeMusicService from '../services/youtubeMusicService';
import type { SpotifyAlbum, SpotifyTrack } from '../types/spotify.types';
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
	spotifyMatches: (SpotifyTrack | SpotifyAlbum)[];
}

export const useYouTubeMusicToSpotify = () => {
	const convert = async (url: string): Promise<ConversionResult> => {
		const trackId = parseYouTubeMusicUrl(url);
		if (trackId) {
			const youtubeMusicTrack = await youtubeMusicService.getTrack(trackId);
			return {
				youtubeMusicTrack,
				spotifyMatches:
					await spotifyService.findTrackMatches(youtubeMusicTrack),
			};
		}
		const albumId = parseYouTubeMusicAlbumUrl(url);
		if (albumId) {
			const youtubeMusicAlbum = await youtubeMusicService.getAlbum(albumId);
			return {
				youtubeMusicAlbum,
				spotifyMatches:
					await spotifyService.findAlbumMatches(youtubeMusicAlbum),
			};
		}
		throw new Error('Unsupported YouTube Music URL');
	};
	return { convert };
};
