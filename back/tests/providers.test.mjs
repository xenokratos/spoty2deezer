import assert from 'node:assert/strict';
import test from 'node:test';
import { reference } from '../lib/music-link.mjs';
import { ProviderError } from '../resolver/errors.mjs';
import { createProviders } from '../resolver/providers.mjs';
import {
	albumId,
	context,
	spotifyHtml,
	spotifyId,
	track,
	youtubeAlbumHtml,
} from './fixtures.mjs';

test('missing credentials produce explicit search links without making catalog calls', async () => {
	const http = {
		get: async () => {
			throw new Error('Unexpected network');
		},
	};
	const providers = createProviders({ http, env: {} });
	for (const platform of ['spotify', 'youtubeMusic']) {
		const result = await providers[platform].search(track(), context());
		assert.equal(result.searchOnly, true);
		assert.equal(result.candidates[0].search, true);
	}
});
test('Spotify source falls back to structured embed metadata when API access is denied', async () => {
	const providers = createProviders({
		env: { SPOTIFY_CLIENT_ID: 'test', SPOTIFY_CLIENT_SECRET: 'test' },
		http: {
			get: async (url) => {
				if (url.includes('/api/token'))
					return { access_token: 'test', expires_in: 3600 };
				if (url.includes('api.spotify.com'))
					throw new ProviderError('ACCESS_DENIED');
				return spotifyHtml();
			},
		},
	});
	const result = await providers.spotify.get(
		reference('spotify', 'track', spotifyId),
		context(),
	);
	assert.equal(result.artist, 'Charles Aznavour');
	assert.equal(result.metadataMethod, 'embed');
});
test('Spotify refreshes a rejected token once and searches by ISRC before title', async () => {
	let tokens = 0;
	const queries = [];
	const providers = createProviders({
		env: { SPOTIFY_CLIENT_ID: 'test', SPOTIFY_CLIENT_SECRET: 'test' },
		http: {
			get: async (url, options) => {
				if (url.includes('/api/token'))
					return { access_token: `test${++tokens}`, expires_in: 3600 };
				queries.push(options.params.q);
				if (options.headers.Authorization === 'Bearer test1')
					throw new ProviderError('AUTH_EXPIRED');
				return {
					tracks: {
						items: [
							{
								id: spotifyId,
								name: 'La bohème',
								artists: [{ name: 'Charles Aznavour' }],
								external_ids: { isrc: 'FRZ116500010' },
								duration_ms: 245000,
							},
						],
					},
				};
			},
		},
	});
	const result = await providers.spotify.search(track(), context());
	assert.equal(tokens, 2);
	assert.ok(queries.every((q) => q.startsWith('isrc:')));
	assert.equal(result.candidates[0].isrc, track().isrc);
});
test('YouTube album reads the album page and remains an album rather than a generic track', async () => {
	const providers = createProviders({
		env: {},
		http: {
			get: async (url) => {
				assert.equal(url, `https://music.youtube.com/playlist?list=${albumId}`);
				return youtubeAlbumHtml;
			},
		},
	});
	const result = await providers.youtubeMusic.get(
		reference('youtubeMusic', 'album', albumId),
		context(),
	);
	assert.equal(result.kind, 'album');
	assert.equal(result.artist, 'Charles Aznavour');
});
test('Deezer distinguishes a successful empty catalog from an outage', async () => {
	const empty = createProviders({
		env: {},
		http: { get: async () => ({ data: [] }) },
	});
	assert.deepEqual(
		(await empty.deezer.search(track({ isrc: undefined }), context()))
			.candidates,
		[],
	);
	const offline = createProviders({
		env: {},
		http: {
			get: async () => {
				throw new ProviderError('PROVIDER_UNAVAILABLE');
			},
		},
	});
	await assert.rejects(offline.deezer.search(track(), context()), {
		code: 'PROVIDER_UNAVAILABLE',
	});
});
test('Deezer identifier misses fall back to text search and normalize candidate durations', async () => {
	const calls = [];
	const providers = createProviders({
		env: {},
		http: {
			get: async (url) => {
				calls.push(url);
				if (url.includes('isrc:')) return { error: { code: 800 } };
				if (url.includes('/search'))
					return {
						data: [
							{
								id: 1,
								title: 'La bohème',
								artist: { name: 'Charles Aznavour' },
							},
						],
					};
				return {
					id: 1,
					title: 'La bohème',
					artist: { name: 'Charles Aznavour' },
					duration: 245,
					isrc: track().isrc,
				};
			},
		},
	});
	const result = await providers.deezer.search(track(), context());
	assert.equal(calls.length, 3);
	assert.equal(result.candidates[0].durationMs, 245000);
});

test('token acquisition aborts when its last caller cancels', async () => {
	let upstream;
	const providers = createProviders({
		env: { SPOTIFY_CLIENT_ID: 'test', SPOTIFY_CLIENT_SECRET: 'test' },
		http: {
			get: async (_url, { signal }) => {
				upstream = signal;
				await new Promise((_resolve, reject) =>
					signal.addEventListener('abort', () => reject(signal.reason), {
						once: true,
					}),
				);
			},
		},
	});
	const controller = new AbortController();
	const pending = providers.spotify.search(track(), {
		signal: controller.signal,
		market: 'FR',
	});
	await Promise.resolve();
	await Promise.resolve();
	controller.abort();
	await assert.rejects(pending, { name: 'AbortError' });
	assert.equal(upstream.aborted, true);
});
test('album UPC searches precede metadata searches and paginate complete Spotify track lists', async () => {
	const queries = [];
	const providers = createProviders({
		env: { SPOTIFY_CLIENT_ID: 'test', SPOTIFY_CLIENT_SECRET: 'test' },
		http: {
			get: async (url, options) => {
				if (url.includes('/api/token'))
					return { access_token: 'test', expires_in: 3600 };
				if (url.endsWith('/search')) {
					queries.push(options.params.q);
					return {
						albums: {
							items: [
								{ id: spotifyId, name: 'Album', artists: [{ name: 'Artist' }] },
							],
						},
					};
				}
				if (url.endsWith('/tracks'))
					return {
						items: [
							{ name: 'B', artists: [{ name: 'Artist' }], duration_ms: 180000 },
						],
						next: null,
					};
				return {
					id: spotifyId,
					name: 'Album',
					artists: [{ name: 'Artist' }],
					total_tracks: 2,
					external_ids: { upc: '12345' },
					tracks: {
						items: [
							{ name: 'A', artists: [{ name: 'Artist' }], duration_ms: 180000 },
						],
						next: `https://api.spotify.com/v1/albums/${spotifyId}/tracks?offset=1`,
					},
				};
			},
		},
	});
	const result = await providers.spotify.search(
		track({ kind: 'album', upc: '12345' }),
		context(),
	);
	assert.equal(queries[0], 'upc:12345');
	assert.equal(result.candidates[0].tracks.length, 2);
	assert.equal(result.candidates[0].tracksComplete, true);
});
test('unplayable Spotify identifier hits do not block a playable metadata fallback', async () => {
	const queries = [];
	const providers = createProviders({
		env: { SPOTIFY_CLIENT_ID: 'test', SPOTIFY_CLIENT_SECRET: 'test' },
		http: {
			get: async (url, options) => {
				if (url.includes('/api/token'))
					return { access_token: 'test', expires_in: 3600 };
				const q = options.params.q;
				queries.push(q);
				return {
					tracks: {
						items: [
							{
								id: spotifyId,
								name: 'La bohème',
								artists: [{ name: 'Charles Aznavour' }],
								is_playable: !q.startsWith('isrc:'),
							},
						],
					},
				};
			},
		},
	});
	const result = await providers.spotify.search(track(), context());
	assert.equal(queries.length, 2);
	assert.equal(result.candidates[0].isPlayable, true);
});
test('one unavailable candidate does not discard the remaining Deezer results', async () => {
	const providers = createProviders({
		env: {},
		http: {
			get: async (url) => {
				if (url.includes('/search')) return { data: [{ id: 1 }, { id: 2 }] };
				if (url.endsWith('/1')) throw new ProviderError('PROVIDER_UNAVAILABLE');
				return {
					id: 2,
					title: 'La bohème',
					artist: { name: 'Charles Aznavour' },
				};
			},
		},
	});
	const result = await providers.deezer.search(
		track({ isrc: undefined }),
		context(),
	);
	assert.equal(result.candidates.length, 1);
	assert.equal(result.partial, true);
});
