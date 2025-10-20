import * as cheerio from "cheerio";
import levenshtein from "fast-levenshtein";
import type {
	DeezerAlbum,
	DeezerApiAlbum,
	DeezerApiSearchResponse,
	DeezerApiTrack,
	DeezerSearchResponse,
	DeezerTrack,
} from "../types/deezer.types";
import { fetchWithProxy } from "../utils/responseWrapper";

interface ScoredTrack {
	track: DeezerTrack;
	score: number;
	isHighQuality?: boolean;
}

/**
 * Result interface for track matching with threshold-based filtering
 */
interface MatchingResults {
	highQuality: DeezerTrack[];
	exploreMore: DeezerTrack[];
}

/**
 * Service for interacting with Deezer API using axios with responseWrapper for CORS handling
 */
class DeezerService {
	private readonly baseURL = "https://api.deezer.com";

	/**
	 * Get track information by track ID using Deezer API
	 * @param trackId - The Deezer track ID or short link identifier
	 * @returns Track information
	 * @throws Error if track is not found or fetch fails
	 */
	async getTrack(trackId: string): Promise<DeezerTrack> {
		try {
			// Handle shortened Deezer links
			if (trackId.startsWith("short:")) {
				const shortCode = trackId.substring(6); // Remove 'short:' prefix
				return this.getTrackFromShortLink(shortCode);
			}

			const trackUrl = `${this.baseURL}/track/${trackId}`;

			// Use fetchWithProxy for CORS handling with automatic fallback
			const data = await fetchWithProxy<DeezerApiTrack>(trackUrl, {
				timeout: 15000, // Increased timeout
			});
			if (!data || typeof data !== "object" || !data.id || !data.title) {
				throw new Error("Invalid track data from Deezer API");
			}

			// Handle different response structures
			const artist = data.artist?.name || "Unknown Artist";
			const album = data.album?.title || "";
			const cover = data.album?.cover_medium || "";

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
			const axiosError = error as {
				response?: { status?: number };
				code?: string;
			};
			if (axiosError.response?.status === 404) {
				throw new Error(
					"Track not found on Deezer. Please verify the URL is correct.",
				);
			}
			if (
				axiosError.response?.status === 403 ||
				axiosError.response?.status === 401
			) {
				throw new Error("Unable to access Deezer. Please try again later.");
			}
			if (
				axiosError.code === "ECONNABORTED" ||
				axiosError.code === "ETIMEDOUT"
			) {
				throw new Error(
					"Connection timeout. Please check your internet connection and try again.",
				);
			}
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
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
				$('meta[property="og:title"]').attr("content") || "Unknown Track";
			const ogDescription =
				$('meta[property="og:description"]').attr("content") || "";
			const twitterCreator =
				$('meta[property="twitter:creator"]').attr("content") || "";
			const cover = $('meta[property="og:image"]').attr("content") || "";
			const duration = parseInt(
				$('meta[property="music:duration"]').attr("content") || "0",
			);
			const preview =
				$('meta[property="music:preview_url:url"]').attr("content") || "";

			// Parse artist and additional info from og:description (format: "Artist - titre - year")
			let artist = twitterCreator || "Unknown Artist";
			if (ogDescription && !twitterCreator) {
				const descParts = ogDescription.split(" - ");
				if (descParts.length >= 1) {
					artist = descParts[0] || "Unknown Artist";
				}
			}

			// Try to extract track ID from the page using cheerio
			let trackId = "0";
			const scriptContent = $("script").html();
			if (scriptContent) {
				const trackIdMatch = scriptContent.match(/SNG_ID":"(\d+)"/);
				trackId = trackIdMatch?.[1] || "0";
			}

			// If we found a track ID, try to get full track data
			if (trackId && trackId !== "0") {
				try {
					return this.getTrack(trackId);
				} catch (_error) {
					console.log("Failed to fetch full track data, using parsed info");
				}
			}

			// Return parsed track information
			return {
				id: parseInt(trackId) || 0,
				title: title,
				artist: artist,
				album: "", // Not easily extractable from this page
				duration: duration,
				preview: preview,
				link: shortUrl,
				cover: cover,
			};
		} catch (error) {
			console.error("Error resolving shortened Deezer link:", error);

			// Fallback: Return a generic track that will be matched by the search algorithms
			return {
				id: 0,
				title: "Unknown Track",
				artist: "Unknown Artist",
				album: "",
				duration: 0,
				preview: "",
				link: `https://link.deezer.com/s/${shortCode}`,
				cover: "",
			};
		}
	}

	/**
	 * Normalize string for better matching
	 * @param str - String to normalize
	 * @returns Normalized string
	 */
	private normalizeString(str: string): string {
		if (!str || typeof str !== "string") {
			return "";
		}
		return str
			.toLowerCase()
			.replace(/\s*\(.*?\)\s*/g, "") // Remove content in parentheses (feat., remix, etc.)
			.replace(/\s*\[.*?\]\s*/g, "") // Remove content in brackets
			.replace(/[^\w\s]/g, "") // Remove special characters
			.replace(/\s+/g, " ") // Normalize spaces
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
			typeof str1 !== "string" ||
			typeof str2 !== "string"
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
			if (!query || query.trim() === "" || query.includes("undefined")) {
				throw new Error("Invalid search query provided");
			}

			const params = new URLSearchParams({
				q: query.trim(),
				limit: String(Math.min(limit, 5)), // Limit to max 5 results to avoid large responses
				strict: "on", // Strict search to get better matches
			});

			const searchUrl = `${this.baseURL}/search?${params}`;

			// Use fetchWithProxy for CORS handling with automatic fallback
			const rawResponse = await fetchWithProxy(searchUrl, {
				timeout: 25000, // Increased timeout for multiple proxy attempts
			});

			// Check if response contains error
			if (
				rawResponse &&
				typeof rawResponse === "object" &&
				"error" in rawResponse
			) {
				throw new Error(
					(rawResponse as any).error.message || "Deezer API error",
				);
			}

			// Type assertion for successful response
			const data = rawResponse as DeezerSearchResponse;

			console.log(
				"Deezer search response received, data length:",
				data?.data?.length || "unknown",
			);

			// Validate response structure
			if (
				!data ||
				typeof data !== "object" ||
				!("data" in data) ||
				!Array.isArray(data.data)
			) {
				throw new Error("Invalid response structure from Deezer API");
			}

			return data.data.map((track: DeezerApiTrack) => ({
				id: track.id,
				title: track.title,
				artist: track.artist?.name || "Unknown Artist",
				album: track.album?.title || "",
				duration: track.duration,
				preview: track.preview,
				link: track.link,
				cover: track.album?.cover_medium || "",
			}));
		} catch (error) {
			const axiosError = error as {
				response?: { status?: number };
				code?: string;
			};
			if (
				axiosError.response?.status === 403 ||
				axiosError.response?.status === 401
			) {
				throw new Error("Unable to search Deezer. Please try again later.");
			}
			if (
				axiosError.code === "ECONNABORTED" ||
				axiosError.code === "ETIMEDOUT"
			) {
				throw new Error(
					"Connection timeout. Please check your internet connection and try again.",
				);
			}
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			throw new Error(`Failed to search tracks on Deezer: ${errorMessage}`);
		}
	}

	/**
	 * Find best matches for a track on Deezer with threshold-based filtering
	 * @param sourceTrack - The source track to match (from Spotify or YouTube Music)
	 * @returns Array of Deezer tracks, prioritizing high-quality matches, then explore-more if needed
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

		const allMatches: MatchingResults = {
			highQuality: [],
			exploreMore: [],
		};

		for (const query of searchQueries) {
			if (!query || query.trim() === "" || query.includes("undefined"))
				continue;

			try {
				const results = await this.searchTrack(query, 3); // Reduced to 3 results

				if (results.length > 0) {
					// Find all matches and categorize them
					const matches = this.findBestMatches(results, sourceTrack);
					allMatches.highQuality.push(...matches.highQuality);
					allMatches.exploreMore.push(...matches.exploreMore);
				}
			} catch (searchError) {
				console.warn(`Search failed for query "${query}":`, searchError);
				// Continue with other queries
			}
		}

		// Remove duplicates and sort by score within each category
		const uniqueHighQuality = new Map<number, DeezerTrack>();
		const uniqueExploreMore = new Map<number, DeezerTrack>();

		// Process high-quality matches first
		for (const track of allMatches.highQuality) {
			uniqueHighQuality.set(track.id, track);
		}

		// Process explore-more matches
		for (const track of allMatches.exploreMore) {
			uniqueExploreMore.set(track.id, track);
		}

		// Return high-quality matches first, then explore-more if no high-quality matches exist
		if (uniqueHighQuality.size > 0) {
			return Array.from(uniqueHighQuality.values()).slice(0, 5);
		} else if (uniqueExploreMore.size > 0) {
			// Mark explore-more results for special handling in UI
			return Array.from(uniqueExploreMore.values()).slice(0, 5);
		}

		return [];
	}

	/**
	 * Find the best matching tracks from search results, separating high-quality and explore-more results
	 * @param results - Array of Deezer search results
	 * @param sourceTrack - The source track to match against (from Spotify or YouTube Music)
	 * @returns MatchingResults with highQuality and exploreMore arrays
	 */
	private findBestMatches(
		results: DeezerTrack[],
		sourceTrack: {
			name: string;
			artists: string[];
			images?: Array<{ url: string }>;
		},
	): MatchingResults {
		const { name, artists } = sourceTrack;

		// If no artist info from Spotify, use title-only matching with lower threshold
		const hasArtist = artists.length > 0 && artists[0];
		const threshold = 40;

		const highQuality: ScoredTrack[] = [];
		const exploreMore: ScoredTrack[] = [];

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
					result.title || "",
				);

				// Weighted score: artist is slightly more important
				score = artistSimilarity * 0.55 + titleSimilarity * 0.45;
			} else {
				// Title-only matching (when no artist from Spotify)
				const titleSimilarity = this.calculateSimilarity(
					name,
					result.title || "",
				);

				// Check if Spotify title is contained in Deezer title (for partial matches)
				const normalizedSpotify = this.normalizeString(name);
				const normalizedDeezer = this.normalizeString(result.title || "");

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
				"duration" in sourceTrack &&
				sourceTrack.duration !== undefined &&
				sourceTrack.duration !== null &&
				typeof sourceTrack.duration === "number" &&
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

			// Categorize matches based on threshold
			if (score >= threshold) {
				highQuality.push({ track: result, score, isHighQuality: true });
			} else {
				exploreMore.push({ track: result, score, isHighQuality: false });
			}
		}

		return {
			highQuality: highQuality.map((m) => ({
				...m.track,
				isHighQuality: true,
			})),
			exploreMore: exploreMore.map((m) => ({
				...m.track,
				isHighQuality: false,
			})),
		};
	}

	/**
	 * Get album information by album ID using Deezer API
	 * @param albumId - The Deezer album ID
	 * @returns Album information
	 * @throws Error if album is not found or fetch fails
	 */
	async getAlbum(albumId: string): Promise<DeezerAlbum> {
		try {
			const albumUrl = `${this.baseURL}/album/${albumId}`;

			// Use fetchWithProxy for CORS handling with automatic fallback
			const data = await fetchWithProxy<DeezerApiAlbum>(albumUrl, {
				timeout: 15000, // Increased timeout
			});
			if (!data || typeof data !== "object" || !data.id || !data.title) {
				throw new Error("Invalid album data from Deezer API");
			}

			// Handle different response structures
			const artist = data.artist?.name || "Unknown Artist";

			return {
				id: data.id,
				title: data.title,
				artist: artist,
				cover: data.cover_medium || "",
				link: data.link,
				tracks:
					data.tracks?.data?.map((track) => ({
						id: track.id,
						title: track.title,
						artist: track.artist?.name || "",
						album: data.title,
						duration: track.duration,
						preview: track.preview,
						link: track.link,
						cover: data.cover_medium || "",
					})) || [],
				images: data.cover_medium ? [{ url: data.cover_medium }] : [],
				name: data.title,
				artists: artist ? [artist] : [],
				total_tracks: data.nb_tracks,
			};
		} catch (error) {
			const axiosError = error as {
				response?: { status?: number };
				code?: string;
			};
			if (axiosError.response?.status === 404) {
				throw new Error(
					"Album not found on Deezer. Please verify the URL is correct.",
				);
			}
			if (
				axiosError.response?.status === 403 ||
				axiosError.response?.status === 401
			) {
				throw new Error("Unable to access Deezer. Please try again later.");
			}
			if (
				axiosError.code === "ECONNABORTED" ||
				axiosError.code === "ETIMEDOUT"
			) {
				throw new Error(
					"Connection timeout. Please check your internet connection and try again.",
				);
			}
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			throw new Error(`Failed to fetch album from Deezer: ${errorMessage}`);
		}
	}

	/**
	 * Find album matches on Deezer based on Spotify album information with threshold-based filtering
	 * @param sourceAlbum - The Spotify album to find matches for
	 * @returns Array of matching Deezer albums, prioritizing high-quality matches, then explore-more if needed
	 */
	async findAlbumMatches(sourceAlbum: any): Promise<DeezerAlbum[]> {
		try {
			// Search for the album using the search endpoint
			const searchQuery = encodeURIComponent(
				`${sourceAlbum.name} ${sourceAlbum.artists.join(" ")}`,
			);
			const searchUrl = `${this.baseURL}/search/album?q=${searchQuery}&limit=10`;

			const data = await fetchWithProxy<DeezerApiSearchResponse>(searchUrl, {
				timeout: 15000,
			});

			if (!data || !data.data || !Array.isArray(data.data)) {
				return [];
			}

			// Score and filter matches
			const highQualityMatches: { album: DeezerAlbum; score: number }[] = [];
			const exploreMoreMatches: { album: DeezerAlbum; score: number }[] = [];

			const threshold = 40; // Lower threshold for more inclusive matching

			for (const result of data.data) {
				if (
					!result ||
					typeof result !== "object" ||
					!result.id ||
					!result.title
				) {
					continue;
				}

				let score = 0;

				// Artist similarity (most important)
				const artistSimilarity = this.calculateSimilarity(
					sourceAlbum.artists.join(" "),
					result.artist?.name || "",
				);

				// Title similarity
				const titleSimilarity = this.calculateSimilarity(
					sourceAlbum.name,
					result.title,
				);

				// Combined score with more lenient weighting
				score = artistSimilarity * 0.6 + titleSimilarity * 0.4;

				// Bonus for exact or very close artist match
				if (artistSimilarity > 85) {
					score += 15;
				} else if (artistSimilarity > 70) {
					score += 10;
				}

				// Bonus for title matches that are very close
				if (titleSimilarity > 80) {
					score += 5;
				}

				const album: DeezerAlbum = {
					id: result.id,
					title: result.title,
					artist: result.artist?.name || "Unknown Artist",
					cover: result.cover_medium || "",
					link: result.link,
					tracks: [], // We'll fetch tracks separately if needed
					images: result.cover_medium ? [{ url: result.cover_medium }] : [],
					name: result.title, // Map title to name for compatibility
					artists: result.artist?.name ? [result.artist.name] : [],
					total_tracks: result.nb_tracks,
				};

				// Categorize matches based on threshold
				if (score >= threshold) {
					highQualityMatches.push({
						album: { ...album, isHighQuality: true },
						score,
					});
				} else {
					exploreMoreMatches.push({
						album: { ...album, isHighQuality: false },
						score,
					});
				}
			}

			// Return high-quality matches first, then explore-more if no high-quality matches exist
			if (highQualityMatches.length > 0) {
				return highQualityMatches
					.sort((a, b) => b.score - a.score)
					.slice(0, 5)
					.map((match) => match.album);
			} else if (exploreMoreMatches.length > 0) {
				return exploreMoreMatches
					.sort((a, b) => b.score - a.score)
					.slice(0, 5)
					.map((match) => match.album);
			}

			return [];
		} catch (error) {
			// Return empty array on error rather than throwing
			console.warn("Error searching for album matches:", error);
			return [];
		}
	}
}

export default new DeezerService();
