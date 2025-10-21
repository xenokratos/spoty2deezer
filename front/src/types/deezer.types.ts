/**
 * Deezer API type definitions
 */

export interface DeezerTrack {
	id: number;
	title: string;
	artist: string;
	album: string;
	duration: number;
	preview: string;
	link: string;
	cover: string;
	isHighQuality?: boolean;
}

export interface DeezerApiTrack {
	id: number;
	title: string;
	duration: number;
	preview: string;
	link: string;
	artist: {
		name: string;
	};
	album: {
		title: string;
		cover_medium: string;
	};
}

export interface DeezerSearchResponse {
	data: DeezerApiTrack[];
	total?: number;
	next?: string;
}

export interface DeezerAlbum {
	id: number;
	title: string;
	artist: string;
	cover: string;
	link: string;
	tracks?: DeezerTrack[];
	images?: Array<{ url: string }>;
	name?: string;
	artists?: string[];
	total_tracks?: number;
	isHighQuality?: boolean;
}

export interface DeezerApiAlbum {
	id: number;
	title: string;
	link: string;
	cover_medium: string;
	nb_tracks?: number;
	artist: {
		name: string;
	};
	tracks?: {
		data: DeezerApiTrack[];
	};
}

export interface DeezerApiSearchResponse {
	data: DeezerApiAlbum[];
	total?: number;
	next?: string;
}

export interface DeezerApiError {
	error: {
		type: string;
		message: string;
		code: number;
	};
}

export type DeezerApiResponse = DeezerSearchResponse | DeezerApiError;

/**
 * Type guard to check if response is an error
 */
export function isDeezerApiError(
	response: DeezerApiResponse,
): response is DeezerApiError {
	return 'error' in response;
}
