import axios, { type AxiosResponse } from 'axios';

/**
 * Makes a request with automatic proxy fallback and retry logic
 * @param targetUrl - The URL to fetch
 * @param options - Axios request options
 * @returns Promise with the response data
 */
export async function fetchWithProxy<T = any>(
	targetUrl: string,
	options: {
		timeout?: number;
		maxRetries?: number;
		retryDelay?: number;
	} = {},
): Promise<T> {
	const { timeout = 15000, maxRetries = 2, retryDelay = 1000 } = options;

	const backendProxyUrl = createProxyUrl(targetUrl);

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			console.log(
				`Trying backend proxy for ${targetUrl} (attempt ${attempt + 1})`,
			);

			const response = await axios.get(backendProxyUrl, {
				timeout,
				validateStatus: (status) => status >= 200 && status < 400,
			});

			console.log(`✅ Success with backend proxy`);
			return response.data as T;
		} catch (error) {
			console.warn(`❌ Failed with backend proxy:`, (error as Error).message);

			// If this is the last attempt, throw the error
			if (attempt === maxRetries) {
				throw error;
			}

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, retryDelay));
		}
	}

	throw new Error('Backend proxy failed after retries');
}

/**
 * Unwraps response data from CORS proxy services (legacy function)
 * @param response - Axios response object
 * @returns Unwrapped response data
 * @deprecated Use fetchWithProxy for new code
 */
export function unwrapProxyResponse<T>(response: AxiosResponse): T {
	const { data } = response;

	// Handle development mode (direct response from our proxy)
	if (import.meta.env.MODE === 'development') {
		return (typeof data === 'string' ? JSON.parse(data) : data) as T;
	}

	const wrappedResponse = typeof data === 'string' ? JSON.parse(data) : data;

	if (
		wrappedResponse &&
		typeof wrappedResponse === 'object' &&
		'contents' in wrappedResponse
	) {
		const contents = wrappedResponse.contents;
		return (
			typeof contents === 'string' ? JSON.parse(contents) : contents
		) as T;
	}

	// Fallback: return as-is if no wrapping detected
	return data as T;
}

/**
 * Wraps a URL for CORS proxy services in production
 * @param url - The target URL to proxy
 * @returns Proxied URL or direct URL depending on environment
 */
export function createProxyUrl(url: string): string {
	if (import.meta.env.MODE === 'development') {
		return `/proxy?url=${encodeURIComponent(url)}`;
	}

	const backendProxyUrl = import.meta.env.VITE_PROXY_TARGET;

	return `${backendProxyUrl}/proxy?url=${encodeURIComponent(url)}`;
}
