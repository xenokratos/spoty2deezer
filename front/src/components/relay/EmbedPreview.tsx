import { useEffect, useRef, useState } from 'react';
import type { PlatformType } from '../../types/converter.types';
import { useCopy } from './copy';
import { Icon } from './Icon';
import { embedPreview, type Media, platformNames } from './presentation';

interface YouTubePlayer {
	destroy: () => void;
}
interface YouTubeApi {
	Player: new (
		element: HTMLElement,
		options: {
			events: { onError: () => void };
		},
	) => YouTubePlayer;
}
type YouTubeWindow = Window & {
	YT?: YouTubeApi;
	onYouTubeIframeAPIReady?: () => void;
};
let apiPromise: Promise<YouTubeApi> | undefined;

function loadYouTubeApi(): Promise<YouTubeApi> {
	const target = window as YouTubeWindow;
	if (target.YT?.Player) return Promise.resolve(target.YT);
	if (apiPromise) return apiPromise;
	apiPromise = new Promise((resolve, reject) => {
		const script = document.createElement('script');
		const previous = target.onYouTubeIframeAPIReady;
		const timeout = window.setTimeout(
			() => reject(new Error('YouTube player unavailable')),
			10000,
		);
		target.onYouTubeIframeAPIReady = () => {
			window.clearTimeout(timeout);
			previous?.();
			if (target.YT?.Player) resolve(target.YT);
			else reject(new Error('YouTube player unavailable'));
		};
		script.src = 'https://www.youtube.com/iframe_api';
		script.async = true;
		script.onerror = () => {
			window.clearTimeout(timeout);
			reject(new Error('YouTube player unavailable'));
		};
		document.head.append(script);
	});
	return apiPromise;
}

function YouTubeEmbed({ src, title }: { src: string; title: string }) {
	const { copy } = useCopy();
	const host = useRef<HTMLDivElement>(null);
	const [failed, setFailed] = useState(false);
	useEffect(() => {
		let active = true;
		let player: YouTubePlayer | undefined;
		loadYouTubeApi()
			.then((api) => {
				if (!active || !host.current) return;
				const frame = document.createElement('iframe');
				const url = new URL(src);
				url.searchParams.set('enablejsapi', '1');
				url.searchParams.set('origin', window.location.origin);
				frame.src = url.href;
				frame.title = title;
				frame.width = '100%';
				frame.height = '352';
				frame.allow =
					'autoplay; encrypted-media; fullscreen; picture-in-picture';
				frame.allowFullscreen = true;
				frame.referrerPolicy = 'strict-origin-when-cross-origin';
				host.current.append(frame);
				player = new api.Player(frame, {
					events: {
						onError: () => {
							if (active) setFailed(true);
						},
					},
				});
			})
			.catch(() => {
				if (active) setFailed(true);
			});
		return () => {
			active = false;
			player?.destroy();
		};
	}, [src, title]);
	return (
		<>
			<div ref={host} hidden={failed} />
			{failed && (
				<output className="preview-unavailable">
					{copy.previewUnavailable}
				</output>
			)}
		</>
	);
}

export function EmbedPreview({
	media,
	platform,
}: {
	media: Media;
	platform: PlatformType;
}) {
	const { copy } = useCopy();
	const src = embedPreview(media, platform);
	if (!src) return null;
	return (
		<div className={`embed-preview embed-preview-${platform}`}>
			<p className="field-label">{copy.preview}</p>
			{platform === 'youtubeMusic' ? (
				<YouTubeEmbed
					key={src}
					src={src}
					title={`${copy.preview}: ${media.title} — YouTube Music`}
				/>
			) : (
				<iframe
					key={src}
					src={src}
					title={`${copy.preview}: ${media.title} — ${platformNames[platform]}`}
					width="100%"
					height={platform === 'spotify' && media.kind === 'track' ? 152 : 352}
					loading="lazy"
					allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
					allowFullScreen
				/>
			)}
			<a
				className="text-button"
				href={media.url}
				target="_blank"
				rel="noopener noreferrer"
			>
				<Icon name="external" />
				{copy.open} {platformNames[platform]}
			</a>
		</div>
	);
}
