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
