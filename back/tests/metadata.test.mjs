import assert from 'node:assert/strict';
import test from 'node:test';
import { reference } from '../lib/music-link.mjs';
import {
	deezerMedia,
	parseSpotifyEmbed,
	parseYouTubeAlbum,
} from '../resolver/metadata.mjs';
import {
	albumId,
	spotifyHtml,
	spotifyId,
	youtubeAlbumHtml,
} from './fixtures.mjs';

test('Spotify structured metadata supplies the artist without splitting punctuation in titles', () => {
	const ref = reference('spotify', 'track', spotifyId);
	const result = parseSpotifyEmbed(
		spotifyHtml({ name: 'La bohème - Live' }),
		ref,
	);
	assert.equal(result.title, 'La bohème - Live');
	assert.equal(result.artist, 'Charles Aznavour');
	assert.equal(result.durationMs, 245173);
	assert.throws(() =>
		parseSpotifyEmbed(spotifyHtml({ uri: 'spotify:track:other' }), ref),
	);
});
test('YouTube Music album metadata retains artist, title, and album type', () => {
	const result = parseYouTubeAlbum(
		youtubeAlbumHtml,
		reference('youtubeMusic', 'album', albumId),
	);
	assert.equal(result.artist, 'Charles Aznavour');
	assert.equal(result.title, 'La bohème');
	assert.equal(result.kind, 'album');
	assert.throws(() =>
		parseYouTubeAlbum(
			'<html>Sign in</html>',
			reference('youtubeMusic', 'album', albumId),
		),
	);
	assert.throws(() =>
		parseYouTubeAlbum(
			youtubeAlbumHtml.replace('music.album', 'website'),
			reference('youtubeMusic', 'album', albumId),
		),
	);
});
test('Deezer seconds become milliseconds', () => {
	assert.equal(
		deezerMedia(
			{ id: 1, title: 'Song', duration: 245, artist: { name: 'Artist' } },
			'track',
		).durationMs,
		245000,
	);
	assert.throws(() => deezerMedia({ error: { code: 800 } }, 'track'), {
		code: 'NOT_FOUND',
	});
});

test('Spotify album embeds use their subtitle artist and do not assume track lists are complete', () => {
	const ref = reference('spotify', 'album', spotifyId);
	const result = parseSpotifyEmbed(
		spotifyHtml({
			uri: `spotify:album:${spotifyId}`,
			artists: undefined,
			subtitle: 'Daft Punk',
			name: 'Discovery',
			trackList: [
				{ title: 'One More Time', subtitle: 'Daft Punk', duration: 320357 },
			],
		}),
		ref,
	);
	assert.equal(result.artist, 'Daft Punk');
	assert.equal(result.kind, 'album');
	assert.equal(result.tracksComplete, false);
	assert.equal(result.trackCount, undefined);
});
