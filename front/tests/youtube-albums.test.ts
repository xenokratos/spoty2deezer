import assert from 'node:assert/strict';
import test from 'node:test';
import {
	embedPreview,
	presentMedia,
	supportedPlatform,
} from '../src/components/relay/presentation.ts';
import { parseYouTubeAlbum } from '../src/services/youtubeAlbumMetadata.ts';
import { parseYouTubeMusicAlbumUrl } from '../src/utils/urlParser.ts';

const id = 'OLAK5uy_mOc1th972qKWclHh98LPE58fSjzjTeLuo';
const url = `https://music.youtube.com/playlist?list=${id}&si=GTS2C_KKvpIjCTQ_`;
const html =
	'<meta property="og:title" content="La bohème"><meta property="og:description" content="Album&nbsp;• Charles Aznavour"><meta property="og:type" content="music.album"><meta property="og:image" content="https://example.com/cover.jpg">';

test('the reported album share URL is recognized, with tracking parameters ignored', () => {
	assert.equal(parseYouTubeMusicAlbumUrl(url), id);
	assert.equal(supportedPlatform(url), 'youtubeMusic');
	assert.equal(
		parseYouTubeMusicAlbumUrl(
			url.replace('music.youtube.com', 'music.youtube.com.example.com'),
		),
		null,
	);
	assert.equal(
		parseYouTubeMusicAlbumUrl(
			'https://music.youtube.com/playlist?list=PLnormal',
		),
		null,
	);
});

test('album metadata retains the album title and artist through presentation and preview', () => {
	const metadata = parseYouTubeAlbum(html);
	assert.equal(metadata.name, 'La bohème');
	assert.deepEqual(metadata.artists, ['Charles Aznavour']);
	const media = presentMedia(
		{
			...metadata,
			id,
			url,
			channel: 'Charles Aznavour',
			thumbnail: '',
			external_urls: { youtube: url },
		},
		'album',
	);
	assert.equal(media.kind, 'album');
	assert.equal(media.artist, 'Charles Aznavour');
	assert.equal(
		embedPreview(media, 'youtubeMusic'),
		`https://www.youtube-nocookie.com/embed/videoseries?list=${id}`,
	);
});

test('unavailable or non-album pages do not become fabricated source albums', () => {
	assert.throws(() => parseYouTubeAlbum('<html>Sign in</html>'));
	assert.throws(() =>
		parseYouTubeAlbum(html.replace('music.album', 'website')),
	);
});
