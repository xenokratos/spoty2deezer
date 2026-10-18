import { useId, useState } from 'react';
import type { PlatformType } from '../../types/converter.types';
import { useCopy } from './copy';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { MediaActions, Platform, SourceCard } from './MediaCard';
import {
	type Destination,
	type Media,
	manualSearch,
	type Results as ResultData,
} from './presentation';

function DestinationCard({
	destination,
	source,
	onCopy,
	onDetails,
	onRetry,
	busy,
}: {
	destination: Destination;
	source: Media;
	onCopy: (url: string) => void;
	onDetails: (media: Media, platform: PlatformType) => void;
	onRetry: () => void;
	busy: boolean;
}) {
	const { copy } = useCopy();
	const [expanded, setExpanded] = useState(false);
	const listId = useId();
	const [first, ...other] = destination.matches;
	return (
		<article className="destination">
			<div className="destination-heading">
				<Platform platform={destination.platform} />
				<span className={`badge ${destination.failed ? 'warning' : ''}`}>
					<Icon
						name={
							destination.failed ? 'alert' : first?.search ? 'search' : 'info'
						}
					/>
					{destination.failed
						? copy.unavailable
						: !first
							? copy.noResults
							: first?.search
								? copy.searchLink
								: first?.quality
									? copy.top
									: copy.checkVersion}
				</span>
			</div>
			{first ? (
				<>
					{destination.failed && (
						<div className="retained-result">
							<p className="muted">{copy.previousResult}</p>
							<button
								type="button"
								className="text-button"
								disabled={busy}
								onClick={onRetry}
							>
								<Icon name="retry" />
								{copy.retry}
							</button>
						</div>
					)}
					<h3>{first.title}</h3>
					<p className="muted match-artist">
						{first.artist} · {first.kind === 'album' ? copy.album : copy.track}
					</p>
					<p className="match-hint">
						{first.search ? copy.searchCopy : copy.suggestionCopy}
					</p>
					<MediaActions
						media={first}
						platform={destination.platform}
						onCopy={onCopy}
					/>
					<div className="destination-links">
						{other.length > 0 && (
							<button
								type="button"
								className="text-button"
								onClick={() => setExpanded(!expanded)}
								aria-expanded={expanded}
								aria-controls={listId}
							>
								<Icon
									name="chevron"
									style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
								/>
								{expanded
									? copy.hideOther
									: first.search
										? copy.moreSearches
										: copy.other}{' '}
								<span>({other.length})</span>
							</button>
						)}
						<button
							type="button"
							className="text-button"
							onClick={() => onDetails(first, destination.platform)}
						>
							<Icon name="info" />
							{copy.details}
						</button>
					</div>
					<div id={listId} hidden={!expanded}>
						{other.map((media) => (
							<div className="alternate" key={`${media.kind}-${media.id}`}>
								<span className="media-type">
									{media.kind === 'album' ? copy.album : copy.track}
									{media.search ? ` · ${copy.searchLink}` : ''}
								</span>
								<h4>{media.title}</h4>
								<p className="muted">{media.artist}</p>
								<MediaActions
									media={media}
									platform={destination.platform}
									onCopy={onCopy}
								/>
							</div>
						))}
					</div>
				</>
			) : (
				<div className="empty-destination">
					<Icon name={destination.failed ? 'retry' : 'search'} />
					<h3>{destination.failed ? copy.unavailable : copy.noMatches}</h3>
					<p className="muted">
						{destination.failed ? copy.unavailableCopy : copy.noMatchesCopy}
					</p>
					{destination.failed && (
						<button
							type="button"
							className="button secondary"
							disabled={busy}
							onClick={onRetry}
						>
							<Icon name="retry" />
							{busy ? copy.searching : copy.retry}
						</button>
					)}
					{!destination.failed && (
						<a
							className="button secondary"
							href={manualSearch(destination.platform, source)}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Icon name="search" />
							{copy.searchOn}
						</a>
					)}
				</div>
			)}
		</article>
	);
}

export function Results({
	result,
	onCopy,
	onClear,
	onRetry,
	busy,
	copyNotice,
}: {
	result: ResultData;
	onCopy: (url: string) => void;
	onClear: () => void;
	onRetry: () => void;
	busy: boolean;
	copyNotice: { url: string; id: number } | null;
}) {
	const { copy } = useCopy();
	const titleId = useId();
	const [selected, setSelected] = useState<{
		media: Media;
		platform: PlatformType;
	} | null>(null);
	return (
		<section className="results-section" aria-labelledby={titleId}>
			<div className="results-heading">
				<div>
					<p className="eyebrow">{copy.ready}</p>
					<h2 id={titleId}>{copy.resultTitle}</h2>
				</div>
				<button className="button secondary" type="button" onClick={onClear}>
					<Icon name="plus" />
					{copy.newLink}
				</button>
			</div>
			<SourceCard media={result.source} platform={result.platform} />
			<div className="destinations">
				{result.destinations.map((destination) => (
					<DestinationCard
						key={destination.platform}
						destination={destination}
						source={result.source}
						onCopy={onCopy}
						onDetails={(media, platform) => setSelected({ media, platform })}
						onRetry={onRetry}
						busy={busy}
					/>
				))}
			</div>
			<Dialog
				open={!!selected}
				title={copy.detailsTitle}
				onClose={() => setSelected(null)}
			>
				<SourceCard media={result.source} />
				{selected && (
					<SourceCard
						media={selected.media}
						platform={selected.platform}
						label={copy.suggestion}
					/>
				)}
				<p className="muted">
					{selected?.media.search ? copy.searchCopy : copy.verify}
				</p>
				{selected && (
					<MediaActions
						media={selected.media}
						platform={selected.platform}
						onCopy={onCopy}
					/>
				)}
				<output className="dialog-feedback" aria-live="polite">
					{copyNotice && copyNotice.url === selected?.media.url && (
						<span key={copyNotice.id}>
							<Icon name="check" />
							{copy.copied}
						</span>
					)}
				</output>
			</Dialog>
		</section>
	);
}
