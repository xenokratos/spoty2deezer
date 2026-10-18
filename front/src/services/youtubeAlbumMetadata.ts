import { load } from 'cheerio';

export function parseYouTubeAlbum(html: string) {
	const $ = load(html);
	const name = $('meta[property="og:title"]').attr('content')?.trim();
	const description =
		$('meta[property="og:description"]').attr('content') ?? '';
	const artist = description.split('•').slice(1).join('•').trim();
	if (
		$('meta[property="og:type"]').attr('content') !== 'music.album' ||
		!name ||
		!artist
	) {
		throw new Error('Unable to read YouTube Music album metadata');
	}
	const image = $('meta[property="og:image"]').attr('content');
	return {
		name,
		artists: [artist],
		images: image?.startsWith('https://') ? [{ url: image }] : [],
	};
}
