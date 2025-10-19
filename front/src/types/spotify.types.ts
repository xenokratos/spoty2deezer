/**
 * Spotify API type definitions
 */

export interface SpotifyImage {
	url: string;
	height?: number;
	width?: number;
}

export interface SpotifyExternalUrls {
	spotify: string;
}

export interface SpotifyTrack {
	id: string;
	name: string;
	artists: string[];
	album: string;
	duration?: number;
	external_urls: SpotifyExternalUrls;
	images: SpotifyImage[];
}

export interface SpotifyAlbum {
	id: string;
	name: string;
	artists: string[];
	tracks?: SpotifyTrack[];
	release_date?: string;
	total_tracks?: number;
	external_urls: SpotifyExternalUrls;
	images: SpotifyImage[];
}

export interface SpotifyOEmbedResponse {
	title?: string;
	thumbnail_url?: string;
	html?: string;
}
