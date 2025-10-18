/**
 * Converter component type definitions
 */

import type { DeezerTrack } from './deezer.types';
import type { SpotifyTrack } from './spotify.types';
import type { YouTubeMusicTrack } from './youtubeMusic.types';

export type PlatformType = 'spotify' | 'deezer';

export type SourceTrack = SpotifyTrack | DeezerTrack;

export interface ConversionResult {
	source: SourceTrack;
	platform: PlatformType;
	deezerMatches: DeezerTrack[];
	spotifyMatches: SpotifyTrack[];
	youtubeMatches: YouTubeMusicTrack[];
}

// Legacy support - keeping spotify field for backward compatibility
export interface LegacyConversionResult {
	spotify: SpotifyTrack;
	deezerMatches: DeezerTrack[];
}
