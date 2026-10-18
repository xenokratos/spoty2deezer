import { setTimeout as delay } from 'node:timers/promises';
import axios from 'axios';
import { ProviderError } from './errors.mjs';

const hosts = new Set([
	'open.spotify.com',
	'accounts.spotify.com',
	'api.spotify.com',
	'api.deezer.com',
	'www.deezer.com',
	'deezer.com',
	'link.deezer.com',
	'www.googleapis.com',
	'www.youtube.com',
	'music.youtube.com',
	'youtube.com',
]);
export function validateTarget(value) {
	const url = new URL(value);
	if (
		url.protocol !== 'https:' ||
		!hosts.has(url.hostname) ||
		url.port ||
		url.username ||
		url.password
	)
		throw new ProviderError('INVALID_UPSTREAM_URL');
	return url;
}
export function createHttp({ transport = axios, now = Date.now } = {}) {
	const cooldowns = new Map();
	async function request(value, options = {}, attempt = 0) {
		let { signal, method = 'GET', headers = {}, data, params } = options;
		let url = validateTarget(value);
		const credentialed =
			Object.keys(headers).some(
				(key) => key.toLowerCase() === 'authorization',
			) ||
			Boolean(params?.key) ||
			url.searchParams.has('key');
		for (let redirects = 0; redirects <= 4; redirects++) {
			signal?.throwIfAborted();
			const cooldown = (cooldowns.get(url.hostname) ?? 0) - now();
			if (cooldown > 0)
				throw new ProviderError('RATE_LIMITED', { retryAfterMs: cooldown });
			let response;
			try {
				response = await transport.request({
					url: url.href,
					method,
					headers: {
						Accept: 'application/json, text/html',
						'User-Agent': 'MusConv/2.0',
						...headers,
					},
					data,
					params,
					signal,
					timeout: 8000,
					maxRedirects: 0,
					maxContentLength: 4 * 1024 * 1024,
					validateStatus: () => true,
				});
			} catch (error) {
				if (signal?.aborted) throw signal.reason;
				if (attempt === 0) {
					await delay(150, undefined, { signal });
					return request(value, options, 1);
				}
				throw new ProviderError(
					['ECONNABORTED', 'ETIMEDOUT'].includes(error.code)
						? 'TIMEOUT'
						: 'PROVIDER_UNAVAILABLE',
				);
			}
			if (
				response.status >= 300 &&
				response.status < 400 &&
				response.headers.location
			) {
				const next = validateTarget(
					new URL(response.headers.location, url).href,
				);
				if (next.hostname !== url.hostname && credentialed)
					throw new ProviderError('INVALID_UPSTREAM_REDIRECT');
				url = next;
				params = undefined;
				continue;
			}
			if (response.status === 429) {
				const value = response.headers['retry-after'];
				const delay =
					Number.isFinite(Number(value)) && value !== undefined
						? Number(value) * 1000
						: Date.parse(value) - now();
				const retryAfterMs = Math.max(
					1000,
					Number.isFinite(delay) ? delay : 30000,
				);
				const expires = Math.max(
					cooldowns.get(url.hostname) ?? 0,
					now() + retryAfterMs,
				);
				cooldowns.set(url.hostname, expires);
				throw new ProviderError('RATE_LIMITED', {
					retryAfterMs: expires - now(),
				});
			}
			if (response.status === 404)
				throw new ProviderError('NOT_FOUND', { status: 404 });
			if (response.status === 401) throw new ProviderError('AUTH_EXPIRED');
			if (response.status === 403) throw new ProviderError('ACCESS_DENIED');
			if (response.status >= 500 && attempt === 0) {
				await delay(150, undefined, { signal });
				return request(value, options, 1);
			}
			if (response.status < 200 || response.status >= 300)
				throw new ProviderError('PROVIDER_UNAVAILABLE');
			return { data: response.data, url: url.href };
		}
		throw new ProviderError('TOO_MANY_REDIRECTS');
	}
	return {
		request,
		get: async (url, options) => (await request(url, options)).data,
	};
}
