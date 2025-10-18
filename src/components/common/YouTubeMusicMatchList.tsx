import { useTranslation } from 'react-i18next';
import type { YouTubeMusicTrack } from '../../types/youtubeMusic.types';

interface YouTubeMusicMatchListProps {
	matches: YouTubeMusicTrack[];
	onOpenURL: (url: string) => void;
	onCopyToClipboard: (text: string) => void;
}

export const YouTubeMusicMatchList = ({
	matches,
	onOpenURL,
	onCopyToClipboard,
}: YouTubeMusicMatchListProps) => {
	const { t } = useTranslation();
	const handleMatchClick = (url: string) => {
		return () => {
			onOpenURL(url);
		};
	};

	const handleCopyClick = (link: string) => {
		return (e: React.MouseEvent) => {
			e.stopPropagation();
			onCopyToClipboard(link);
		};
	};

	return (
		<div className="flex flex-col gap-2">
			<p className="text-gray-600 text-sm font-semibold uppercase tracking-wider px-2 mb-2">
				{matches.length === 1
					? t('results.topMatch')
					: t('results.otherMatches')}
			</p>
			{matches.map((match, index) => (
				<button
					key={match.id}
					type="button"
					onClick={handleMatchClick(match.url)}
					className={`flex items-center gap-4 px-4 py-3 justify-between rounded-lg transition-opacity hover:opacity-70 ${
						index === 0
							? 'bg-red-50 border-2 border-youtube'
							: 'bg-white shadow'
					}`}
				>
					<div className="flex items-center gap-3 flex-1 min-w-0">
						{match.thumbnail && (
							<img
								src={match.thumbnail}
								alt={match.name}
								className="w-10 h-10 rounded flex-shrink-0"
							/>
						)}
						<div className="flex flex-col justify-center flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 truncate">
								{match.name}
							</p>
							<p className="text-gray-600 text-xs truncate">{match.channel}</p>
						</div>
					</div>
					<div className="flex items-center gap-2 flex-shrink-0">
						<button
							type="button"
							onClick={handleCopyClick(match.url)}
							className="hover:scale-110 transition-transform"
						>
							<span className="text-youtube text-xl">📋</span>
						</button>
						<span className="text-youtube text-xl">✓</span>
					</div>
				</button>
			))}
		</div>
	);
};
