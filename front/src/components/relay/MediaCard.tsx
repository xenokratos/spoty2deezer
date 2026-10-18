import { useState } from 'react';
import deezerLogo from '../../assets/platforms/deezer.png';
import spotifyLogo from '../../assets/platforms/spotify.svg';
import youtubeMusicLogo from '../../assets/platforms/youtube-music.png';
import type { PlatformType } from '../../types/converter.types';
import { useCopy } from './copy';
import { Icon } from './Icon';
import { type Media, platformNames } from './presentation';

const platformLogos: Record<PlatformType, string> = {
	spotify: spotifyLogo,
	deezer: deezerLogo,
	youtubeMusic: youtubeMusicLogo,
};

export function Artwork({ media }: { media: Media }) {
	const [failed, setFailed] = useState(false);
	return (
		<div className="artwork">
			{media.artwork && !failed ? (
				<img src={media.artwork} alt="" onError={() => setFailed(true)} />
			) : (
				<Icon name="music" />
			)}
		</div>
	);
}

export function Platform({ platform }: { platform: PlatformType }) {
	return (
		<span className="platform">
			<span className="platform-icon">
				<img src={platformLogos[platform]} alt="" width="24" height="24" />
			</span>
			{platformNames[platform]}
		</span>
	);
}

export function SourceCard({
	media,
	platform,
	label,
}: {
	media: Media;
	platform?: PlatformType;
	label?: string;
}) {
	const { copy } = useCopy();
	return (
		<div className="source-card">
			<Artwork key={media.artwork} media={media} />
			<div>
				<p className="eyebrow">
					{label ?? copy.source}
					{platform ? ` · ${platformNames[platform]}` : ''}
				</p>
				<h3>{media.title}</h3>
				<p className="muted">{media.artist || copy.artistUnavailable}</p>
				<span className="media-type">
					{media.kind === 'album' ? copy.album : copy.track}
					{media.albumTitle ? ` · ${media.albumTitle}` : ''}
					{media.trackCount ? ` · ${media.trackCount} ${copy.tracks}` : ''}
				</span>
			</div>
		</div>
	);
}

export function MediaActions({
	media,
	platform,
	onCopy,
}: {
	media: Media;
	platform: PlatformType;
	onCopy: (url: string) => void;
}) {
	const { copy } = useCopy();
	return (
		<div className="media-actions">
			{media.url && (
				<a
					className="button primary"
					href={media.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`${media.search ? copy.searchOn : copy.open} ${platformNames[platform]}`}
				>
					<Icon name={media.search ? 'search' : 'external'} />
					{media.search ? copy.searchOn : copy.open}
				</a>
			)}
			<button
				className="button secondary"
				type="button"
				disabled={!media.url}
				onClick={() => onCopy(media.url)}
			>
				<Icon name="copy" />
				{copy.copy}
			</button>
		</div>
	);
}
