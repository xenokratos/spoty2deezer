import assert from 'node:assert/strict';
import test from 'node:test';
import {
	embedPreview,
	type Media,
	presentMedia,
	safeLink,
	supportedPlatform,
} from '../src/components/relay/presentation.ts';

test('previews use fixed player hosts and reject search links or lookalike hosts', () => {
	const media: Media = {
		id: '1',
		title: 'Song',
		artist: 'Artist',
		url: 'https://open.spotify.com/track/1WvvmEowf7hiz5EnyAwtTj?si=test',
		kind: 'track',
		search: false,
		quality: true,
	};
	assert.equal(
		embedPreview(media, 'spotify'),
		'https://open.spotify.com/embed/track/1WvvmEowf7hiz5EnyAwtTj',
	);
	assert.equal(
		embedPreview(
			{ ...media, url: 'https://www.deezer.com/fr/track/123' },
			'deezer',
		),
		'https://widget.deezer.com/widget/light/track/123',
	);
	assert.equal(
		embedPreview(
			{
				...media,
				url: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=other',
			},
			'youtubeMusic',
		),
		'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
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
			{ ...media, url: 'https://music.youtube.com/watch?v=bad' },
			'youtubeMusic',
		),
		null,
	);
});

test('only advertises input formats backed by conversion hooks', () => {
	assert.equal(
		supportedPlatform('spotify:album:15FZlljjgimILw4hn7urFj'),
		'spotify',
	);
	assert.equal(
		supportedPlatform('https://www.deezer.com/en/track/12345'),
		'deezer',
	);
	assert.equal(supportedPlatform('https://link.deezer.com/s/abc123'), 'deezer');
	assert.equal(
		supportedPlatform('https://music.youtube.com/watch?v=dQw4w9WgXcQ'),
		'youtubeMusic',
	);
	assert.equal(
		supportedPlatform('https://music.youtube.com/playlist?list=PLdemo'),
		null,
	);
	assert.equal(supportedPlatform('https://deezer.com/album/1234'), null);
	assert.equal(supportedPlatform('https://fake-spotify.com/track/abc'), null);
	assert.equal(supportedPlatform(''), null);
});

test('search suggestions remain searches even when the service marks them high quality', () => {
	const media = presentMedia({
		id: 'search-1',
		name: 'Song',
		artists: ['Artist'],
		album: '',
		images: [],
		external_urls: { spotify: 'https://open.spotify.com/search/Artist%20Song' },
		isHighQuality: true,
	});
	assert.equal(media.search, true);
	assert.equal(media.title, 'Song');
	assert.equal(media.artist, 'Artist');
});

test('album cards and track fallbacks retain their own type and destination', () => {
	const album = presentMedia(
		{
			id: 1,
			title: 'Album',
			artist: 'Artist',
			cover: '',
			link: 'https://www.deezer.com/album/1',
			total_tracks: 6,
		},
		'album',
	);
	const track = presentMedia({
		id: 2,
		title: 'Track',
		artist: 'Artist',
		album: 'Album',
		cover: '',
		link: 'https://www.deezer.com/track/2',
		preview: '',
		duration: 10,
	});
	assert.equal(album.kind, 'album');
	assert.equal(album.trackCount, 6);
	assert.equal(track.kind, 'track');
	assert.equal(track.albumTitle, 'Album');
	assert.equal(track.url, 'https://www.deezer.com/track/2');
});

test('unsafe destination schemes cannot become open or copy actions', () => {
	assert.equal(safeLink('javascript:alert(1)'), '');
	assert.equal(safeLink('data:text/html,test'), '');
	assert.equal(
		safeLink('https://music.youtube.com/search?q=song'),
		'https://music.youtube.com/search?q=song',
	);
});
