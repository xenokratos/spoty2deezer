import type { AxiosError } from 'axios';
import type { SpotifyAlbum, SpotifyOEmbedResponse, SpotifyTrack } from '../types/spotify.types';
import { fetchWithProxy } from '../utils/responseWrapper';

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

			// Build the full oEmbed URL, then fetch via proxy with automatic fallback
			const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`;

			// Use the new fetchWithProxy function with retry logic
			const oembedData = await fetchWithProxy<SpotifyOEmbedResponse>(oembedUrl, {
				timeout: 15000, // Increased timeout
			});

			// Base object from oEmbed
			const trackInfo: SpotifyTrack = {
				id: trackId,
				name: oembedData.title ?? '',
				artists: [],
				album: '',
				external_urls: { spotify: trackUrl },
				images: oembedData.thumbnail_url ? [{ url: oembedData.thumbnail_url }] : [],
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
				throw new Error('Track not found on Spotify. Please verify the URL is correct.');
			}
			if (axiosError.response?.status === 403 || axiosError.response?.status === 401) {
				throw new Error('Unable to access Spotify. Please try again later.');
			}
			if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
				throw new Error('Connection timeout. Please check your internet connection and try again.');
			}
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			throw new Error(`Failed to fetch track from Spotify: ${errorMessage}`);
		}
	}

	/**
	 * Get album information by album ID using oEmbed API
	 * @param albumId - The Spotify album ID
	 * @returns Album information
	 * @throws Error if album is not found or fetch fails
	 */
	async getAlbum(albumId: string): Promise<SpotifyAlbum> {
		try {
			const albumUrl = `https://open.spotify.com/album/${albumId}`;

			// Build the full oEmbed URL, then fetch via proxy with automatic fallback
			const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(albumUrl)}`;

			// Use the new fetchWithProxy function with retry logic
			const oembedData = await fetchWithProxy<SpotifyOEmbedResponse>(oembedUrl, {
				timeout: 15000, // Increased timeout
			});

			// Base object from oEmbed
			const albumInfo: SpotifyAlbum = {
				id: albumId,
				name: oembedData.title ?? '',
				artists: [],
				external_urls: { spotify: albumUrl },
				images: oembedData.thumbnail_url ? [{ url: oembedData.thumbnail_url }] : [],
			};

			// Parse artist/album from oEmbed title.
			// Common formats observed:
			//  - "Album Title - Artist"
			//  - "Album Title – Artist" (en dash)
			//  - "Album Title — Artist" (em dash)
			if (oembedData.title) {
				const parts = oembedData.title.split(/\s[-–—]\s/); // split on hyphen/en/em dash with spaces
				if (parts.length >= 2) {
					const [maybeTitle, ...rest] = parts;
					if (maybeTitle) {
						albumInfo.name = maybeTitle.trim();
						albumInfo.artists = [rest.join(' - ').trim()];
					}
				} else if (parts.length === 1) {
					if (parts[0]) {
						albumInfo.name = parts[0].trim();
					}
				}
			}

			// Ensure we have at least a name or an artist; otherwise treat as failure
			if (!albumInfo.name && albumInfo.artists.length === 0) {
				throw new Error(
					'Unable to extract album information from Spotify. Please check the URL and try again.',
				);
			}

			return albumInfo;
		} catch (error) {
			const axiosError = error as AxiosError;
			if (axiosError.response?.status === 404) {
				throw new Error('Album not found on Spotify. Please verify the URL is correct.');
			}
			if (axiosError.response?.status === 403 || axiosError.response?.status === 401) {
				throw new Error('Unable to access Spotify. Please try again later.');
			}
			if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
				throw new Error('Connection timeout. Please check your internet connection and try again.');
			}
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			throw new Error(`Failed to fetch album from Spotify: ${errorMessage}`);
		}
	}

	/**
	 * Get album tracks by getting individual tracks (for now, as Spotify oEmbed doesn't provide track listing)
	 * @param _albumId - The Spotify album ID (currently unused as oEmbed doesn't provide track listings)
	 * @returns Promise that resolves when tracks are loaded (currently returns empty array)
	 * @throws Error if album is not found or fetch fails
	 */
	async getAlbumTracks(_albumId: string): Promise<SpotifyTrack[]> {
		// For now, return empty array as Spotify oEmbed doesn't provide track listings
		// In a real implementation, this would require Spotify Web API access with authentication
		return Promise.resolve([]);
	}
}

export default new SpotifyService();
