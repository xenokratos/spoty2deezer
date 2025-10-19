import * as cheerio from 'cheerio';
import levenshtein from 'fast-levenshtein';
import type {
	DeezerApiTrack,
	DeezerSearchResponse,
	DeezerTrack,
} from '../types/deezer.types';
import { fetchWithProxy } from '../utils/responseWrapper';

interface ScoredTrack {
	track: DeezerTrack;
	score: number;
}

/**
 * Service for interacting with Deezer API using axios with responseWrapper for CORS handling
 */
class DeezerService {
	private readonly baseURL = 'https://api.deezer.com';

	/**
	 * Get track information by track ID using Deezer API
	 * @param trackId - The Deezer track ID or short link identifier
	 * @returns Track information
	 * @throws Error if track is not found or fetch fails
	 */
	async getTrack(trackId: string): Promise<DeezerTrack> {
		try {
			// Handle shortened Deezer links
			if (trackId.startsWith('short:')) {
				const shortCode = trackId.substring(6); // Remove 'short:' prefix
				return this.getTrackFromShortLink(shortCode);
			}

			const trackUrl = `${this.baseURL}/track/${trackId}`;

			// Use fetchWithProxy for CORS handling with automatic fallback
			const data = await fetchWithProxy<DeezerApiTrack>(trackUrl, {
				timeout: 15000, // Increased timeout
			});
			if (!data || typeof data !== 'object' || !data.id || !data.title) {
				throw new Error('Invalid track data from Deezer API');
			}

			// Handle different response structures
			const artist = data.artist?.name || 'Unknown Artist';
			const album = data.album?.title || '';
			const cover = data.album?.cover_medium || '';

			return {
				id: data.id,
				title: data.title,
				artist: artist,
				album: album,
				duration: data.duration,
				preview: data.preview,
				link: data.link,
				cover: cover,
			};
		} catch (error) {
			const axiosError = error as any;
			if (axiosError.response?.status === 404) {
				throw new Error(
					'Track not found on Deezer. Please verify the URL is correct.',
				);
			}
			if (
				axiosError.response?.status === 403 ||
				axiosError.response?.status === 401
			) {
				throw new Error('Unable to access Deezer. Please try again later.');
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
			throw new Error(`Failed to fetch track from Deezer: ${errorMessage}`);
		}
	}

	/**
	 * Get track information from a shortened Deezer link using axios
	 * @param shortCode - The short link code
	 * @returns Track information
	 */
	private async getTrackFromShortLink(shortCode: string): Promise<DeezerTrack> {
		try {
			const shortUrl = `https://link.deezer.com/s/${shortCode}`;

			// Try to resolve the shortened link using fetchWithProxy
			// First attempt: follow redirects to get the final URL
			const responseData = await fetchWithProxy<string>(shortUrl, {
				timeout: 15000, // Increased timeout for HTML scraping
			});

			// Parse the HTML response using cheerio
			const $ = cheerio.load(responseData);

			// Extract track information from meta tags using cheerio
			const title =
				$('meta[property="og:title"]').attr('content') || 'Unknown Track';
			const ogDescription =
				$('meta[property="og:description"]').attr('content') || '';
			const twitterCreator =
				$('meta[property="twitter:creator"]').attr('content') || '';
			const cover = $('meta[property="og:image"]').attr('content') || '';
			const duration = parseInt(
				$('meta[property="music:duration"]').attr('content') || '0',
			);
			const preview =
				$('meta[property="music:preview_url:url"]').attr('content') || '';

			// Parse artist and additional info from og:description (format: "Artist - titre - year")
			let artist = twitterCreator || 'Unknown Artist';
			if (ogDescription && !twitterCreator) {
				const descParts = ogDescription.split(' - ');
				if (descParts.length >= 1) {
					artist = descParts[0] || 'Unknown Artist';
				}
			}

			// Try to extract track ID from the page using cheerio
			let trackId = '0';
			const scriptContent = $('script').html();
			if (scriptContent) {
				const trackIdMatch = scriptContent.match(/SNG_ID":"(\d+)"/);
				trackId = trackIdMatch?.[1] || '0';
			}

			// If we found a track ID, try to get full track data
			if (trackId && trackId !== '0') {
				try {
					return this.getTrack(trackId);
				} catch (_error) {
					console.log('Failed to fetch full track data, using parsed info');
				}
			}

			// Return parsed track information
			return {
				id: parseInt(trackId) || 0,
				title: title,
				artist: artist,
				album: '', // Not easily extractable from this page
				duration: duration,
				preview: preview,
				link: shortUrl,
				cover: cover,
			};
		} catch (error) {
			console.error('Error resolving shortened Deezer link:', error);

			// Fallback: Return a generic track that will be matched by the search algorithms
			return {
				id: 0,
				title: 'Unknown Track',
				artist: 'Unknown Artist',
				album: '',
				duration: 0,
				preview: '',
				link: `https://link.deezer.com/s/${shortCode}`,
				cover: '',
			};
		}
	}

	/**
	 * Normalize string for better matching
	 * @param str - String to normalize
	 * @returns Normalized string
	 */
	private normalizeString(str: string): string {
		if (!str || typeof str !== 'string') {
			return '';
		}
		return str
			.toLowerCase()
			.replace(/\s*\(.*?\)\s*/g, '') // Remove content in parentheses (feat., remix, etc.)
			.replace(/\s*\[.*?\]\s*/g, '') // Remove content in brackets
			.replace(/[^\w\s]/g, '') // Remove special characters
			.replace(/\s+/g, ' ') // Normalize spaces
			.trim();
	}

	/**
	 * Calculate similarity between two strings using Levenshtein distance
	 * @param str1 - First string
	 * @param str2 - Second string
	 * @returns Similarity score (0-100, where 100 is identical)
	 */
	private calculateSimilarity(str1: string, str2: string): number {
		// Handle undefined or null strings
		if (
			!str1 ||
			!str2 ||
			typeof str1 !== 'string' ||
			typeof str2 !== 'string'
		) {
			return 0;
		}

		const normalized1 = this.normalizeString(str1);
		const normalized2 = this.normalizeString(str2);

		if (normalized1 === normalized2) {
			return 100;
		}

		const maxLength = Math.max(normalized1.length, normalized2.length);
		if (maxLength === 0) {
			return 100;
		}

		const distance = levenshtein.get(normalized1, normalized2);
		return Math.round(((maxLength - distance) / maxLength) * 100);
	}

	/**
	 * Search for tracks on Deezer using axios with responseWrapper for CORS handling
	 * @param query - The search query
	 * @param limit - Maximum number of results to return
	 * @returns Array of matching tracks
	 */
	async searchTrack(query: string, limit = 10): Promise<DeezerTrack[]> {
		try {
			// Validate query
			if (!query || query.trim() === '' || query.includes('undefined')) {
				throw new Error('Invalid search query provided');
			}

			const params = new URLSearchParams({
				q: query.trim(),
				limit: String(Math.min(limit, 5)), // Limit to max 5 results to avoid large responses
				strict: 'on', // Strict search to get better matches
			});

			const searchUrl = `${this.baseURL}/search?${params}`;

			// Use fetchWithProxy for CORS handling with automatic fallback
			const rawResponse = await fetchWithProxy(searchUrl, {
				timeout: 25000, // Increased timeout for multiple proxy attempts
			});

			// Check if response contains error
			if (
				rawResponse &&
				typeof rawResponse === 'object' &&
				'error' in rawResponse
			) {
				throw new Error(
					(rawResponse as any).error.message || 'Deezer API error',
				);
			}

			// Type assertion for successful response
			const data = rawResponse as DeezerSearchResponse;

			console.log(
				'Deezer search response received, data length:',
				data?.data?.length || 'unknown',
			);

			// Validate response structure
			if (
				!data ||
				typeof data !== 'object' ||
				!('data' in data) ||
				!Array.isArray(data.data)
			) {
				throw new Error('Invalid response structure from Deezer API');
			}

			return data.data.map((track: DeezerApiTrack) => ({
				id: track.id,
				title: track.title,
				artist: track.artist?.name || 'Unknown Artist',
				album: track.album?.title || '',
				duration: track.duration,
				preview: track.preview,
				link: track.link,
				cover: track.album?.cover_medium || '',
			}));
		} catch (error) {
			const axiosError = error as any;
			if (
				axiosError.response?.status === 403 ||
				axiosError.response?.status === 401
			) {
				throw new Error('Unable to search Deezer. Please try again later.');
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
			throw new Error(`Failed to search tracks on Deezer: ${errorMessage}`);
		}
	}

	/**
	 * Find best matches for a track on Deezer (up to 5)
	 * @param sourceTrack - The source track to match (from Spotify or YouTube Music)
	 * @returns Array of up to 5 best matching Deezer tracks
	 */
	async findTrackMatches(sourceTrack: {
		name: string;
		artists: string[];
		images?: Array<{ url: string }>;
	}): Promise<DeezerTrack[]> {
		const { name, artists } = sourceTrack;

		// Create search queries with different combinations
		const searchQueries = [
			// Most specific: artist + title (only if artist exists)
			...(artists.length > 0 && artists[0] ? [`${artists[0]} ${name}`] : []),
			// Just title if artist search fails or no artist available
			name,
		];

		const allMatches: ScoredTrack[] = [];

		for (const query of searchQueries) {
			if (!query || query.trim() === '' || query.includes('undefined'))
				continue;

			try {
				const results = await this.searchTrack(query, 3); // Reduced to 3 results

				if (results.length > 0) {
					// Find all good matches
					const matches = this.findBestMatches(results, sourceTrack);
					allMatches.push(...matches);
				}
			} catch (searchError) {
				console.warn(`Search failed for query "${query}":`, searchError);
				// Continue with other queries
			}
		}

		// Remove duplicates and sort by score
		const uniqueMatches = new Map<number, ScoredTrack>();
		for (const match of allMatches) {
			const existing = uniqueMatches.get(match.track.id);
			if (!existing || match.score > existing.score) {
				uniqueMatches.set(match.track.id, match);
			}
		}

		// Sort by score and return top 5
		return Array.from(uniqueMatches.values())
			.sort((a, b) => b.score - a.score)
			.slice(0, 5)
			.map((m) => m.track);
	}

	/**
	 * Find the best matching tracks from search results
	 * @param results - Array of Deezer search results
	 * @param sourceTrack - The source track to match against (from Spotify or YouTube Music)
	 * @returns Array of scored tracks that meet the threshold
	 */
	private findBestMatches(
		results: DeezerTrack[],
		sourceTrack: {
			name: string;
			artists: string[];
			images?: Array<{ url: string }>;
		},
	): ScoredTrack[] {
		const { name, artists } = sourceTrack;

		// If no artist info from Spotify, use title-only matching with lower threshold
		const hasArtist = artists.length > 0 && artists[0];
		const threshold = hasArtist ? 70 : 50; // Lower threshold when no artist available

		const matches: ScoredTrack[] = [];

		for (const result of results) {
			if (!result) continue;

			let score = 0;

			if (hasArtist && artists[0] && result.artist) {
				// Standard matching with artist
				const artistSimilarity = this.calculateSimilarity(
					artists[0],
					result.artist,
				);
				const titleSimilarity = this.calculateSimilarity(
					name,
					result.title || '',
				);

				// Weighted score: artist is slightly more important
				score = artistSimilarity * 0.55 + titleSimilarity * 0.45;
			} else {
				// Title-only matching (when no artist from Spotify)
				const titleSimilarity = this.calculateSimilarity(
					name,
					result.title || '',
				);

				// Check if Spotify title is contained in Deezer title (for partial matches)
				const normalizedSpotify = this.normalizeString(name);
				const normalizedDeezer = this.normalizeString(result.title || '');

				if (normalizedSpotify && normalizedDeezer) {
					const isPartialMatch =
						normalizedDeezer.includes(normalizedSpotify) ||
						normalizedSpotify.includes(normalizedDeezer);

					if (isPartialMatch) {
						// Boost score for partial matches
						score = titleSimilarity * 1.2; // 20% bonus
					} else {
						score = titleSimilarity;
					}
				} else {
					score = titleSimilarity;
				}
			}

			// Bonus for duration match (if available)
			if (
				'duration' in sourceTrack &&
				sourceTrack.duration !== undefined &&
				sourceTrack.duration !== null &&
				typeof sourceTrack.duration === 'number' &&
				result.duration
			) {
				const durationDiff = Math.abs(
					sourceTrack.duration / 1000 - result.duration,
				);
				if (durationDiff < 5) {
					score += 5;
				} else if (durationDiff < 15) {
					score += 2;
				}
			}

			// Accept matches with dynamic threshold
			if (score >= threshold) {
				matches.push({ track: result, score });
			}
		}

		return matches;
	}
}

export default new DeezerService();
