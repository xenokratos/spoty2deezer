/**
 * YouTube Music API type definitions
 */

export interface YouTubeMusicOEmbedResponse {
	title: string;
	author_name: string;
	author_url: string;
	type: string;
	height: number;
	width: number;
	version: string;
	provider_name: string;
	provider_url: string;
	thumbnail_height: number;
	thumbnail_width: number;
	thumbnail_url: string;
	html: string;
}

export interface YouTubeMusicTrack {
	id: string;
	name: string;
	artists: string[];
	channel: string;
	url: string;
	thumbnail: string;
	images: Array<{ url: string }>;
	external_urls: { youtube: string };
	isHighQuality?: boolean;
}
