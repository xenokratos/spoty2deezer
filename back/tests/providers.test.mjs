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

test('Spotify and YouTube return explicit search links without any catalog access', async () => {
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

test('Spotify resolves artist metadata directly from the public embed without authentication', async () => {
	const urls = [];
	const providers = createProviders({
		http: {
			get: async (url) => {
				urls.push(url);
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
	assert.deepEqual(urls, [`https://open.spotify.com/embed/track/${spotifyId}`]);
	assert.equal(providers.spotify.capabilities.catalog, false);
});
test('unavailable Spotify structured metadata falls back to public oEmbed without inventing an artist', async () => {
	const providers = createProviders({
		http: {
			get: async (url) =>
				url.includes('/embed/')
					? '<html>Unavailable</html>'
					: { title: 'La bohème' },
		},
	});
	const result = await providers.spotify.get(
		reference('spotify', 'track', spotifyId),
		context(),
	);
	assert.equal(result.title, 'La bohème');
	assert.equal(result.artist, '');
	assert.equal(result.metadataMethod, 'oembed');
});
test('YouTube track metadata uses only its public oEmbed endpoint', async () => {
	const urls = [];
	const providers = createProviders({
		http: {
			get: async (url) => {
				urls.push(url);
				return { title: 'La bohème', author_name: 'Charles Aznavour - Topic' };
			},
		},
	});
	const result = await providers.youtubeMusic.get(
		reference('youtubeMusic', 'track', '1QJI6sPAiOg'),
		context(),
	);
	assert.equal(result.artist, 'Charles Aznavour');
	assert.deepEqual(urls, ['https://www.youtube.com/oembed']);
	assert.equal(providers.youtubeMusic.capabilities.catalog, false);
});

test('Deezer album metadata follows validated public track-list pagination', async () => {
	const urls = [];
	const providers = createProviders({
		http: {
			get: async (url) => {
				urls.push(url);
				if (url.endsWith('/tracks?index=1'))
					return { data: [{ title: 'B', duration: 180 }], next: null };
				return {
					id: 123,
					title: 'Album',
					artist: { name: 'Artist' },
					nb_tracks: 2,
					tracks: {
						data: [{ title: 'A', duration: 180 }],
						next: 'https://api.deezer.com/album/123/tracks?index=1',
					},
				};
			},
		},
	});
	const result = await providers.deezer.get(
		reference('deezer', 'album', '123'),
		context(),
	);
	assert.equal(result.tracks.length, 2);
	assert.equal(result.tracksComplete, true);
	assert.equal(urls.length, 2);
});
