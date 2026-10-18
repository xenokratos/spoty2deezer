export const spotifyId = '1WvvmEowf7hiz5EnyAwtTj';
export const albumId = 'OLAK5uy_mOc1th972qKWclHh98LPE58fSjzjTeLuo';
export const track = (values = {}) => ({
	id: spotifyId,
	title: 'La bohème',
	artist: 'Charles Aznavour',
	artists: ['Charles Aznavour'],
	kind: 'track',
	url: `https://open.spotify.com/track/${spotifyId}`,
	search: false,
	quality: false,
	durationMs: 245000,
	isrc: 'FRZ116500010',
	...values,
});
export const candidate = (values = {}) =>
	track({ id: '123', url: 'https://www.deezer.com/track/123', ...values });
export const spotifyHtml = (values = {}) =>
	`<script id="__NEXT_DATA__">${JSON.stringify({ props: { pageProps: { state: { data: { entity: { uri: `spotify:track:${spotifyId}`, name: 'La bohème', artists: [{ name: 'Charles Aznavour' }], duration: 245173, ...values } } } } } })}</script>`;
export const youtubeAlbumHtml =
	'<meta property="og:title" content="La bohème"><meta property="og:description" content="Album&nbsp;• Charles Aznavour"><meta property="og:type" content="music.album"><meta property="og:image" content="https://example.com/cover.jpg">';
export const context = () => ({
	signal: new AbortController().signal,
	market: 'FR',
});
