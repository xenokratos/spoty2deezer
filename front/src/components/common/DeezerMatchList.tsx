import { useTranslation } from 'react-i18next';
import type { DeezerTrack } from '../../types/deezer.types';

interface DeezerMatchListProps {
	matches: DeezerTrack[];
	onOpenURL: (url: string) => void;
	onCopyToClipboard: (text: string) => void;
}

export const DeezerMatchList = ({
	matches,
	onOpenURL,
	onCopyToClipboard,
}: DeezerMatchListProps) => {
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
					onClick={handleMatchClick(match.link)}
					className={`flex items-center gap-4 px-4 py-3 justify-between rounded-lg transition-opacity hover:opacity-70 ${
						index === 0
							? 'bg-green-50 border-2 border-secondary'
							: 'bg-white shadow'
					}`}
				>
					<div className="flex items-center gap-3 flex-1 min-w-0">
						{match.cover && (
							<img
								src={match.cover}
								alt={match.title}
								className="w-10 h-10 rounded flex-shrink-0"
							/>
						)}
						<div className="flex flex-col justify-center flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 truncate">
								{match.title}
							</p>
							<p className="text-gray-600 text-xs truncate">
								{match.artist} • {match.album}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 flex-shrink-0">
						<button
							type="button"
							onClick={handleCopyClick(match.link)}
							className="hover:scale-110 transition-transform"
						>
							<span className="text-secondary text-xl">📋</span>
						</button>
						<span className="text-secondary text-xl">✓</span>
					</div>
				</button>
			))}
		</div>
	);
};
