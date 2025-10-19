import { useTranslation } from 'react-i18next';
import type { SourceTrack } from '../../types/converter.types';
import type { DeezerTrack } from '../../types/deezer.types';
import type { YouTubeMusicTrack } from '../../types/youtubeMusic.types';
import { DeezerMatchList } from '../common/DeezerMatchList';
import { SourceTrackCard } from '../common/SourceTrackCard';
import { YouTubeMusicMatchList } from '../common/YouTubeMusicMatchList';

interface ConversionResultsProps {
	sourceTrack: SourceTrack;
	sourcePlatform: 'spotify' | 'deezer';
	deezerMatches: DeezerTrack[];
	youtubeMatches: YouTubeMusicTrack[];
	onClear: () => void;
	onOpenURL: (url: string) => void;
	onCopyToClipboard: (text: string) => void;
}

export const ConversionResults = ({
	sourceTrack,
	sourcePlatform,
	deezerMatches,
	youtubeMatches,
	onClear,
	onOpenURL,
	onCopyToClipboard,
}: ConversionResultsProps) => {
	const { t } = useTranslation();
	return (
		<div className="mb-8">
			{/* Header */}
			<div className="mb-6">
				<h2 className="text-4xl font-black text-gray-900 mb-2">
					{t('results.title')}
				</h2>
				<p className="text-gray-600 text-base">
					{sourcePlatform === 'spotify' &&
						t('results.spotify.matches', {
							count: deezerMatches.length,
							plural: deezerMatches.length !== 1 ? 'es' : '',
							youtubeCount: youtubeMatches.length,
							youtubePlural: youtubeMatches.length !== 1 ? 'es' : '',
						})}
					{sourcePlatform === 'deezer' &&
						t('results.deezer.matches', {
							count: youtubeMatches.length,
							plural: youtubeMatches.length !== 1 ? 'es' : '',
						})}
				</p>
			</div>

			{/* Source Track */}
			<SourceTrackCard track={sourceTrack} />

			{/* Results - Show the two target platforms */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				{/* First Target Platform */}
				<div>
					{sourcePlatform === 'spotify' && (
						<>
							<h3 className="text-2xl font-bold text-secondary mb-4">
								{t('platform.deezer')} Matches
							</h3>
							<DeezerMatchList
								matches={deezerMatches}
								onOpenURL={onOpenURL}
								onCopyToClipboard={onCopyToClipboard}
							/>
						</>
					)}
					{sourcePlatform === 'deezer' && (
						<>
							<h3 className="text-2xl font-bold text-youtube mb-4">
								{t('results.youtube.matches')}
							</h3>

							<YouTubeMusicMatchList
								matches={youtubeMatches}
								onOpenURL={onOpenURL}
								onCopyToClipboard={onCopyToClipboard}
							/>
						</>
					)}
				</div>

				{/* Second Target Platform */}
				<div>
					{sourcePlatform === 'spotify' && (
						<>
							<h3 className="text-2xl font-bold text-youtube mb-4">
								{t('platform.youtube')} Matches
							</h3>
							<YouTubeMusicMatchList
								matches={youtubeMatches}
								onOpenURL={onOpenURL}
								onCopyToClipboard={onCopyToClipboard}
							/>
						</>
					)}
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
				<button
					type="button"
					onClick={onClear}
					className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-green-100 hover:bg-green-200 text-primary font-bold text-base rounded-full transition"
				>
					<span className="text-2xl">➕</span>
					<span>{t('results.clearButton')}</span>
				</button>
			</div>
		</div>
	);
};
