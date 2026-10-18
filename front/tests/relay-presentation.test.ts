import assert from 'node:assert/strict';
import test from 'node:test';
import {
	embedPreview,
	type Media,
	safeLink,
	supportedPlatform,
} from '../src/components/relay/presentation.ts';
import { isResolution } from '../src/utils/resolutionContract.ts';

const media: Media = {
	id: '1WvvmEowf7hiz5EnyAwtTj',
	title: 'La bohème',
	artist: 'Charles Aznavour',
	url: 'https://open.spotify.com/track/1WvvmEowf7hiz5EnyAwtTj',
	kind: 'track',
	search: false,
	quality: false,
};
test('form capabilities use the same canonical parser as the resolver', () => {
	assert.equal(supportedPlatform(media.url), 'spotify');
	assert.equal(
		supportedPlatform('https://www.deezer.com/en/album/123'),
		'deezer',
	);
	assert.equal(
		supportedPlatform(
			'https://music.youtube.com/playlist?si=x&list=OLAK5uy_mOc1th972qKWclHh98LPE58fSjzjTeLuo',
		),
		'youtubeMusic',
	);
	assert.equal(
		supportedPlatform('https://music.youtube.com/playlist?list=PLdemo'),
		null,
	);
	assert.equal(supportedPlatform('https://fake-spotify.com/track/abc'), null);
});
test('embeds accept canonical recordings and albums, never search links or lookalike hosts', () => {
	assert.equal(
		embedPreview(media, 'spotify'),
		'https://open.spotify.com/embed/track/1WvvmEowf7hiz5EnyAwtTj',
	);
	assert.equal(embedPreview({ ...media, search: true }, 'spotify'), null);
	assert.equal(
		embedPreview(
			{
				...media,
				url: media.url.replace(
					'open.spotify.com',
					'open.spotify.com.example.com',
				),
			},
			'spotify',
		),
		null,
	);
	assert.equal(
		embedPreview(
			{
				...media,
				kind: 'album',
				url: 'https://music.youtube.com/playlist?list=OLAK5uy_demo',
			},
			'youtubeMusic',
		),
		'https://www.youtube-nocookie.com/embed/videoseries?list=OLAK5uy_demo',
	);
	assert.equal(safeLink('javascript:alert(1)'), '');
});
test('the frontend rejects malformed or unsafe resolver responses', () => {
	const valid = {
		schemaVersion: 1,
		market: 'FR',
		platform: 'spotify',
		source: media,
		destinations: [
			{ platform: 'deezer', status: 'no_match', failed: false, matches: [] },
			{
				platform: 'youtubeMusic',
				status: 'provider_unavailable',
				failed: true,
				matches: [],
			},
		],
	};
	assert.equal(isResolution(valid), true);
	assert.equal(
		isResolution({
			...valid,
			source: { ...media, url: 'javascript:alert(1)' },
		}),
		false,
	);
	assert.equal(
		isResolution({
			...valid,
			destinations: [valid.destinations[0], valid.destinations[0]],
		}),
		false,
	);
	assert.equal(
		isResolution({
			...valid,
			destinations: [
				{ ...valid.destinations[0], failed: true },
				valid.destinations[1],
			],
		}),
		false,
	);
});
