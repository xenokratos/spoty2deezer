import assert from 'node:assert/strict';
import test from 'node:test';
import { ProviderError } from '../resolver/errors.mjs';
import { createResolver } from '../resolver/index.mjs';
import { searchLink } from '../resolver/providers.mjs';
import { candidate, spotifyId, track } from './fixtures.mjs';

function setup({ deezer = async () => ({ candidates: [candidate()] }) } = {}) {
	let sourceCalls = 0;
	const providers = {
		spotify: {
			get: async () => {
				sourceCalls++;
				return track();
			},
		},
		deezer: { search: deezer },
		youtubeMusic: {
			search: async (source) => ({
				searchOnly: true,
				candidates: [searchLink('youtubeMusic', source)],
			}),
		},
	};
	return {
		resolver: createResolver({ providers, logger: () => {} }),
		sourceCalls: () => sourceCalls,
	};
}
const input = { url: `spotify:track:${spotifyId}` };
test('source metadata is fetched once and successful canonical resolutions are cached by market', async () => {
	const { resolver, sourceCalls } = setup();
	const [a, b] = await Promise.all([
		resolver.resolve(input),
		resolver.resolve({
			url: `https://open.spotify.com/track/${spotifyId}?si=tracking`,
		}),
	]);
	assert.equal(sourceCalls(), 1);
	assert.deepEqual(a, b);
	assert.equal(a.destinations[0].status, 'identifier_match');
	assert.equal(a.destinations[1].status, 'search_link');
	await resolver.resolve({ ...input, market: 'US' });
	assert.equal(sourceCalls(), 2);
});
test('a provider outage preserves the other destination and retries are not served from a failed cache entry', async () => {
	let calls = 0;
	const { resolver } = setup({
		deezer: async () => {
			calls++;
			if (calls === 1)
				throw new ProviderError('RATE_LIMITED', { retryAfterMs: 1000 });
			return { candidates: [candidate()] };
		},
	});
	const first = await resolver.resolve(input);
	assert.equal(first.destinations[0].status, 'provider_unavailable');
	assert.equal(first.destinations[0].error.retryAfterMs, 1000);
	assert.equal(first.destinations[1].status, 'search_link');
	assert.equal(
		(await resolver.resolve(input)).destinations[0].status,
		'identifier_match',
	);
	assert.equal(calls, 2);
});
test('successful empty searches remain no_match rather than provider failures', async () => {
	const { resolver } = setup({ deezer: async () => ({ candidates: [] }) });
	const result = await resolver.resolve(input);
	assert.equal(result.destinations[0].status, 'no_match');
	assert.equal(result.destinations[0].failed, false);
});
test('invalid links and markets fail before contacting a provider', async () => {
	const { resolver, sourceCalls } = setup();
	await assert.rejects(resolver.resolve({ url: 'https://localhost/private' }), {
		code: 'INVALID_INPUT',
	});
	await assert.rejects(resolver.resolve({ ...input, market: 'invalid' }), {
		code: 'INVALID_INPUT',
	});
	assert.equal(sourceCalls(), 0);
});

test('deadline bounds adapters that accidentally ignore cancellation and preserves fast destinations', async () => {
	const providers = {
		spotify: { get: async () => track() },
		deezer: { search: async () => new Promise(() => {}) },
		youtubeMusic: {
			search: async () => ({
				searchOnly: true,
				candidates: [searchLink('youtubeMusic', track())],
			}),
		},
	};
	const resolver = createResolver({
		providers,
		timeoutMs: 10,
		logger: () => {},
	});
	const keepAlive = new Promise((resolve) => setTimeout(resolve, 30));
	const result = await resolver.resolve(input);
	assert.equal(result.destinations[0].error.code, 'TIMEOUT');
	assert.equal(result.destinations[1].status, 'search_link');
	await keepAlive;
});
test('partial candidate results are not cached', async () => {
	let calls = 0;
	const { resolver } = setup({
		deezer: async () => {
			calls++;
			return { candidates: [candidate()], partial: true };
		},
	});
	await resolver.resolve(input);
	await resolver.resolve(input);
	assert.equal(calls, 2);
});
