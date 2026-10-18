import { randomUUID } from 'node:crypto';
import { parseMusicLink, platforms } from '../lib/music-link.mjs';
import { abortable } from './abortable.mjs';
import { ProviderError, publicError } from './errors.mjs';
import { createHttp } from './http.mjs';
import { rankMatches } from './matching.mjs';
import { ResolutionPool } from './pool.mjs';
import { createProviders } from './providers.mjs';

export function createResolver({
	providers = createProviders({ http: createHttp() }),
	pool = new ResolutionPool({
		ttlMs:
			Number.isFinite(Number(process.env.RESOLVER_CACHE_TTL_MS)) &&
			process.env.RESOLVER_CACHE_TTL_MS !== undefined
				? Math.max(
						0,
						Math.min(3600000, Number(process.env.RESOLVER_CACHE_TTL_MS)),
					)
				: 300000,
	}),
	timeoutMs = 20000,
	logger = console.info,
} = {}) {
	return {
		capabilities: Object.fromEntries(
			platforms.map((p) => [p, providers[p].capabilities]),
		),
		async resolve({ url, market = 'FR' } = {}, { signal } = {}) {
			const ref = parseMusicLink(url);
			if (!ref || typeof market !== 'string' || !/^[A-Z]{2}$/.test(market))
				throw new ProviderError('INVALID_INPUT', { status: 400 });
			const key = `${ref.platform}:${ref.kind}:${ref.id}:${market}`;
			return pool.run(
				key,
				async (sharedSignal) => {
					const deadline = AbortSignal.timeout(timeoutMs);
					const operation = AbortSignal.any([sharedSignal, deadline]);
					const requestId = randomUUID();
					const started = Date.now();
					let source;
					try {
						source = await abortable(
							() =>
								providers[ref.platform].get(ref, { signal: operation, market }),
							operation,
						);
					} catch (error) {
						logger(
							JSON.stringify({
								event: 'resolve.source_failed',
								requestId,
								platform: ref.platform,
								kind: ref.kind,
								code: publicError(error).code,
								durationMs: Date.now() - started,
							}),
						);
						throw error;
					}
					operation.throwIfAborted();
					const destinations = await Promise.all(
						platforms
							.filter((p) => p !== ref.platform)
							.map(async (platform) => {
								try {
									const result = await abortable(
										() =>
											providers[platform].search(source, {
												signal: operation,
												market,
											}),
										operation,
									);
									operation.throwIfAborted();
									const matches = result.searchOnly
										? result.candidates
										: rankMatches(source, result.candidates);
									const status = result.searchOnly
										? 'search_link'
										: !matches.length
											? 'no_match'
											: matches[0].match.method === 'identifier'
												? 'identifier_match'
												: 'likely_match';
									logger(
										JSON.stringify({
											event: 'resolve.destination',
											requestId,
											platform,
											status,
											count: matches.length,
											durationMs: Date.now() - started,
										}),
									);
									return {
										platform,
										status,
										failed: false,
										matches,
										...(result.partial ? { partial: true } : {}),
									};
								} catch (error) {
									if (sharedSignal.aborted) throw sharedSignal.reason;
									const issue = publicError(error);
									logger(
										JSON.stringify({
											event: 'resolve.destination',
											requestId,
											platform,
											status: 'provider_unavailable',
											code: issue.code,
											durationMs: Date.now() - started,
										}),
									);
									return {
										platform,
										status: 'provider_unavailable',
										failed: true,
										matches: [],
										error: issue,
									};
								}
							}),
					);
					return {
						schemaVersion: 1,
						market,
						platform: ref.platform,
						source,
						destinations,
					};
				},
				{
					signal,
					cacheable: (value) =>
						value.destinations.every((d) => !d.failed && !d.partial),
				},
			);
		},
	};
}
