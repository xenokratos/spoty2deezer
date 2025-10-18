import axios, { type AxiosError } from 'axios';
import type {
	SpotifyOEmbedResponse,
	SpotifyTrack,
} from '../types/spotify.types';
import { urlProxy } from '../utils/urlProxy';

/**
 * Service for interacting with Spotify API
 */
class SpotifyService {
	/**
	 * Get track information by track ID using oEmbed API
	 * @param trackId - The Spotify track ID
	 * @returns Track information
	 * @throws Error if track is not found or fetch fails
	 */
	async getTrack(trackId: string): Promise<SpotifyTrack> {
		try {
			const trackUrl = `https://open.spotify.com/track/${trackId}`;

			// Build the full oEmbed URL, then route it via the proxy helper.
			// (Proxy in dev, direct or /api/proxy in prod depending on your urlProxy impl.)
			const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`;

			const res = await axios.get(urlProxy(oembedUrl), {
				// Some proxies stream as text; parse JSON ourselves for reliability.
				responseType: 'text',
				transformResponse: (d) => d,
				validateStatus: (s) => s >= 200 && s < 400,
				timeout: 10000,
			});

			const oembedData: SpotifyOEmbedResponse =
				typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

			// Base object from oEmbed
			const trackInfo: SpotifyTrack = {
				id: trackId,
				name: oembedData.title ?? '',
				artists: [],
				album: '',
				external_urls: { spotify: trackUrl },
				images: oembedData.thumbnail_url
					? [{ url: oembedData.thumbnail_url }]
					: [],
			};

			// Parse artist/title from oEmbed title.
			// Common formats observed:
			//  - "Song Title - Artist"
			//  - "Song Title – Artist" (en dash)
			//  - "Song Title — Artist" (em dash)
			// If more than two parts (e.g., multiple artists), join the tail as artist.
			if (oembedData.title) {
				const parts = oembedData.title.split(/\s[-–—]\s/); // split on hyphen/en/em dash with spaces
				if (parts.length >= 2) {
					const [maybeTitle, ...rest] = parts;
					if (maybeTitle) {
						trackInfo.name = maybeTitle.trim();
						trackInfo.artists = [rest.join(' - ').trim()];
					}
				} else if (parts.length === 1) {
					if (parts[0]) {
						trackInfo.name = parts[0].trim();
					}
				}
			}

			// Ensure we have at least a name or an artist; otherwise treat as failure
			if (!trackInfo.name && trackInfo.artists.length === 0) {
				throw new Error(
					'Unable to extract track information from Spotify. Please check the URL and try again.',
				);
			}

			return trackInfo;
		} catch (error) {
			const axiosError = error as AxiosError;
			if (axiosError.response?.status === 404) {
				throw new Error(
					'Track not found on Spotify. Please verify the URL is correct.',
				);
			}
			if (
				axiosError.response?.status === 403 ||
				axiosError.response?.status === 401
			) {
				throw new Error('Unable to access Spotify. Please try again later.');
			}
			if (
				axiosError.code === 'ECONNABORTED' ||
				axiosError.code === 'ETIMEDOUT'
			) {
				throw new Error(
					'Connection timeout. Please check your internet connection and try again.',
				);
			}
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error occurred';
			throw new Error(`Failed to fetch track from Spotify: ${errorMessage}`);
		}
	}
}

export default new SpotifyService();
