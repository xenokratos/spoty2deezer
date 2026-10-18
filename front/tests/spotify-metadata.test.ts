import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSpotifyEmbed } from '../src/services/spotifyMetadata.ts';

const id = '1WvvmEowf7hiz5EnyAwtTj';
const embed = (entity: unknown) =>
	`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { state: { data: { entity } } } } })}</script>`;

test('reads the artist omitted by Spotify oEmbed and preserves title punctuation', () => {
	const entity = {
		uri: `spotify:track:${id}`,
		name: 'La bohème',
		artists: [{ name: 'Charles Aznavour' }],
	};
	assert.deepEqual(parseSpotifyEmbed(embed(entity), 'track', id), {
		name: 'La bohème',
		artists: ['Charles Aznavour'],
	});
	assert.equal(
		parseSpotifyEmbed(embed({ ...entity, name: 'Song - Live' }), 'track', id)
			?.name,
		'Song - Live',
	);
});

test('rejects mismatched, missing, and malformed metadata without inventing an artist', () => {
	assert.equal(
		parseSpotifyEmbed(
			embed({
				uri: 'spotify:track:other',
				name: 'Other',
				artists: [{ name: 'Other' }],
			}),
			'track',
			id,
		),
		undefined,
	);
	assert.equal(
		parseSpotifyEmbed(
			embed({ uri: `spotify:track:${id}`, name: 'La bohème', artists: [] }),
			'track',
			id,
		),
		undefined,
	);
	assert.equal(
		parseSpotifyEmbed(
			'<script id="__NEXT_DATA__">broken</script>',
			'track',
			id,
		),
		undefined,
	);
});
