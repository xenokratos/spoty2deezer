export type Platform = 'spotify' | 'deezer' | 'youtubeMusic';
export interface MusicReference {
	platform: Platform;
	kind: 'track' | 'album';
	id: string;
	url: string;
	short?: boolean;
}
export const platforms: Platform[];
export function parseMusicLink(input: unknown): MusicReference | null;
export function reference(
	platform: Platform,
	kind: MusicReference['kind'],
	id: string,
): MusicReference;
