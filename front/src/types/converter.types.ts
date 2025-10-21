/**
 * Converter component type definitions
 */

import type { DeezerAlbum, DeezerTrack } from './deezer.types';
import type { SpotifyAlbum, SpotifyTrack } from './spotify.types';
import type { YouTubeMusicTrack } from './youtubeMusic.types';

export type PlatformType = 'spotify' | 'deezer' | 'youtubeMusic';

export type SourceTrack = SpotifyTrack | DeezerTrack | YouTubeMusicTrack;
export type SourceAlbum = SpotifyAlbum | DeezerAlbum;

export interface ConversionResult {
	source: SourceTrack | SourceAlbum;
	platform: PlatformType;
	deezerMatches: DeezerTrack[];
	deezerAlbumMatches?: DeezerAlbum[];
	spotifyMatches: SpotifyTrack[];
	spotifyAlbumMatches?: SpotifyAlbum[];
	youtubeMatches: YouTubeMusicTrack[];
}

// Legacy support - keeping spotify field for backward compatibility
export interface LegacyConversionResult {
	spotify: SpotifyTrack;
	deezerMatches: DeezerTrack[];
}
