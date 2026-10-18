import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMusicLink } from '../lib/music-link.mjs';
import { albumId, spotifyId } from './fixtures.mjs';

test('canonical links drop tracking parameters, including reordered YouTube parameters', () => {
	const a = parseMusicLink(
		`https://music.youtube.com/playlist?si=tracking&list=${albumId}`,
	);
	assert.equal(a.kind, 'album');
	assert.equal(a.id, albumId);
	assert.equal(a.url, `https://music.youtube.com/playlist?list=${albumId}`);
	assert.equal(
		parseMusicLink(`spotify:track:${spotifyId}`).url,
		`https://open.spotify.com/track/${spotifyId}`,
	);
	assert.equal(
		parseMusicLink(`https://open.spotify.com/intl-fr/track/${spotifyId}?si=x`)
			.id,
		spotifyId,
	);
	assert.equal(
		parseMusicLink(
			'https://www.youtube.com/watch?si=x&v=dQw4w9WgXcQ&list=PLother',
		).kind,
		'track',
	);
	assert.equal(
		parseMusicLink('https://youtu.be/dQw4w9WgXcQ').id,
		'dQw4w9WgXcQ',
	);
	assert.equal(
		parseMusicLink('https://www.deezer.com/fr/album/123').kind,
		'album',
	);
});
test('lookalike hosts, credentials, arbitrary ports, unsupported playlists and malformed ids are rejected', () => {
	for (const url of [
		`https://open.spotify.com.evil.test/track/${spotifyId}`,
		`https://user@open.spotify.com/track/${spotifyId}`,
		`https://open.spotify.com:8080/track/${spotifyId}`,
		'javascript:alert(1)',
		'https://music.youtube.com/playlist?list=PLnormal',
		'https://open.spotify.com/track/short',
		'https://www.youtube.com/watch?v=bad',
		'https://localhost/track/123',
		'x'.repeat(2049),
	])
		assert.equal(parseMusicLink(url), null, url);
	assert.equal(parseMusicLink('https://link.deezer.com/s/abc123').short, true);
});
