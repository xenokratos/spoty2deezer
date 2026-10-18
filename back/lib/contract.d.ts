import type { Platform } from './music-link.mjs';
export type { Platform } from './music-link.mjs';
export type ResolutionStatus =
	| 'identifier_match'
	| 'likely_match'
	| 'search_link'
	| 'no_match'
	| 'provider_unavailable';
export interface Media {
	id: string;
	title: string;
	artist: string;
	artists?: string[];
	artwork?: string;
	url: string;
	kind: 'track' | 'album';
	search: boolean;
	quality: boolean;
	trackCount?: number;
	albumTitle?: string;
	durationMs?: number;
	isrc?: string;
	upc?: string;
	releaseDate?: string;
	isPlayable?: boolean;
	metadataMethod?: 'api' | 'embed' | 'oembed' | 'html';
	tracksComplete?: boolean;
	tracks?: {
		title: string;
		artists: string[];
		durationMs?: number;
		isrc?: string;
	}[];
	match?: {
		method: 'identifier' | 'metadata' | 'search';
		score?: number;
		reasons: string[];
	};
}
export interface Destination {
	platform: Platform;
	status: ResolutionStatus;
	failed: boolean;
	matches: Media[];
	partial?: boolean;
	error?: { code: string; retryAfterMs?: number };
}
export interface Resolution {
	schemaVersion: 1;
	market: string;
	source: Media;
	platform: Platform;
	destinations: Destination[];
}
