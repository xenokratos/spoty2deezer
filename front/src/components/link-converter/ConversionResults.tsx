import { useTranslation } from "react-i18next";
import type { SourceAlbum, SourceTrack } from "../../types/converter.types";
import type { DeezerAlbum, DeezerTrack } from "../../types/deezer.types";
import type { SpotifyAlbum, SpotifyTrack } from "../../types/spotify.types";
import type { YouTubeMusicTrack } from "../../types/youtubeMusic.types";
import { DeezerMatchList } from "../common/DeezerMatchList";
import { SourceTrackCard } from "../common/SourceTrackCard";
import { SpotifyMatchList } from "../common/SpotifyMatchList";
import { YouTubeMusicMatchList } from "../common/YouTubeMusicMatchList";

interface ConversionResultsProps {
	sourceTrack?: SourceTrack;
	sourceAlbum?: SourceAlbum;
	sourcePlatform: "spotify" | "deezer" | "youtubeMusic";
	deezerMatches: DeezerTrack[];
	deezerAlbumMatches?: DeezerAlbum[];
	youtubeMatches: YouTubeMusicTrack[];
	spotifyMatches: SpotifyTrack[];
	spotifyAlbumMatches?: SpotifyAlbum[];
	onClear: () => void;
	onOpenURL: (url: string) => void;
	onCopyToClipboard: (text: string) => void;
}

export const ConversionResults = ({
	sourceTrack,
	sourceAlbum,
	sourcePlatform,
	deezerMatches,
	deezerAlbumMatches,
	youtubeMatches,
	spotifyMatches,
	spotifyAlbumMatches,
	onClear,
	onOpenURL,
	onCopyToClipboard,
}: ConversionResultsProps) => {
	const { t } = useTranslation();

	// Determine if we have a track or album
	const hasTrack = !!sourceTrack;
	const hasAlbum = !!sourceAlbum;
	const totalDeezerMatches =
		(deezerMatches?.length || 0) + (deezerAlbumMatches?.length || 0);
	const totalSpotifyMatches =
		(spotifyMatches?.length || 0) + (spotifyAlbumMatches?.length || 0);

	return (
		<div className="mb-8">
			{/* Header */}
			<div className="mb-6">
				<h2 className="text-4xl font-black text-gray-900 mb-2">
					{t("results.title")}
				</h2>
				<p className="text-gray-600 text-base">
					{sourcePlatform === "spotify" &&
						hasTrack &&
						t("results.spotify.matches", {
							count: deezerMatches.length,
							plural: deezerMatches.length !== 1 ? "es" : "",
							youtubeCount: youtubeMatches.length,
							youtubePlural: youtubeMatches.length !== 1 ? "es" : "",
						})}
					{sourcePlatform === "spotify" &&
						hasAlbum &&
						t("results.spotify.albumMatches", {
							count: totalDeezerMatches,
							plural: totalDeezerMatches !== 1 ? "es" : "",
							youtubeCount: youtubeMatches.length,
							youtubePlural: youtubeMatches.length !== 1 ? "es" : "",
						})}
					{sourcePlatform === "deezer" &&
						hasTrack &&
						t("results.deezer.matches", {
							spotifyCount: spotifyMatches.length,
							spotifyPlural: spotifyMatches.length !== 1 ? "es" : "",
							youtubeCount: youtubeMatches.length,
							youtubePlural: youtubeMatches.length !== 1 ? "es" : "",
						})}
					{sourcePlatform === "youtubeMusic" &&
						hasTrack &&
						t("results.youtubeMusic.matches", {
							spotifyCount: spotifyMatches.length,
							spotifyPlural: spotifyMatches.length !== 1 ? "es" : "",
							deezerCount: deezerMatches.length,
							deezerPlural: deezerMatches.length !== 1 ? "es" : "",
						})}
					{sourcePlatform === "youtubeMusic" &&
						hasAlbum &&
						t("results.youtubeMusic.albumMatches", {
							spotifyCount: totalSpotifyMatches,
							spotifyPlural: totalSpotifyMatches !== 1 ? "es" : "",
							deezerCount: totalDeezerMatches,
							deezerPlural: totalDeezerMatches !== 1 ? "es" : "",
						})}
				</p>
			</div>

			{/* Source Content */}
			{hasTrack && sourceTrack && <SourceTrackCard track={sourceTrack} />}
			{hasAlbum && sourceAlbum && (
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<h3 className="text-xl font-bold text-gray-900 mb-4">Album</h3>
					<div className="flex items-center gap-4">
						{sourceAlbum.images?.[0]?.url && (
							<img
								src={sourceAlbum.images[0].url}
								alt={sourceAlbum.name}
								className="w-20 h-20 rounded-lg object-cover"
							/>
						)}
						<div>
							<h4 className="text-lg font-semibold text-gray-900">
								{sourceAlbum.name}
							</h4>
							<p className="text-gray-600">
								{Array.isArray(sourceAlbum.artists)
									? sourceAlbum.artists.join(", ")
									: sourceAlbum.artists}
							</p>
							{sourceAlbum.total_tracks && (
								<p className="text-sm text-gray-500">
									{sourceAlbum.total_tracks} tracks
								</p>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Results - Show the two target platforms */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				{sourcePlatform !== "spotify" && (
					<div>
						{/* Spotify Matches */}
						{hasTrack && (
							<>
								<h3 className="text-2xl font-bold text-primary mb-4">
									{t("platform.spotify")} Matches
								</h3>
								<SpotifyMatchList
									matches={spotifyMatches}
									onOpenURL={onOpenURL}
									onCopyToClipboard={onCopyToClipboard}
									showAsExploreMore={
										!spotifyMatches.some((m) => m.isHighQuality !== false)
									}
								/>
							</>
						)}
						{hasAlbum &&
							spotifyAlbumMatches &&
							spotifyAlbumMatches.length > 0 && (
								<>
									<h3 className="text-2xl font-bold text-primary mb-4">
										{t("platform.spotify")} Album Matches
									</h3>
									<div className="flex flex-col gap-2">
										<p className="text-gray-600 text-sm font-semibold uppercase tracking-wider px-2 mb-2">
											{spotifyAlbumMatches.length === 1
												? t("results.topMatch")
												: t("results.otherMatches")}
										</p>
										{spotifyAlbumMatches.map((album, index) => (
											<button
												key={album.id}
												type="button"
												onClick={() => onOpenURL(album.external_urls.spotify)}
												className={`flex items-center gap-4 px-4 py-3 justify-between rounded-lg transition-opacity hover:opacity-70 ${index === 0
													? "bg-green-50 border-2 border-primary"
													: "bg-white shadow"
													}`}
											>
												<div className="flex items-center gap-3 flex-1 min-w-0">
													{album.images?.[0]?.url && (
														<img
															src={album.images[0].url}
															alt={album.name}
															className="w-10 h-10 rounded flex-shrink-0"
														/>
													)}
													<div className="flex flex-col justify-center flex-1 min-w-0">
														<p className="text-sm font-medium text-gray-900 truncate">
															{album.name}
														</p>
														<p className="text-gray-600 text-xs truncate">
															{album.artists.join(", ")}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2 flex-shrink-0">
													<div
														onClick={(e) => {
															e.stopPropagation();
															onCopyToClipboard(album.external_urls.spotify);
														}}
														className="hover:scale-110 transition-transform cursor-pointer"
														role="button"
														tabIndex={0}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.preventDefault();
																e.stopPropagation();
																onCopyToClipboard(
																	album.external_urls.spotify,
																);
															}
														}}
													>
														<span className="text-primary text-xl">📋</span>
													</div>
													<span className="text-primary text-xl">✓</span>
												</div>
											</button>
										))}
									</div>
								</>
							)}
						{hasAlbum && spotifyMatches.length > 0 && (
							<>
								<h3 className="text-2xl font-bold text-primary mb-4">
									{t("platform.spotify")} Track Matches
								</h3>
								<SpotifyMatchList
									matches={spotifyMatches}
									onOpenURL={onOpenURL}
									onCopyToClipboard={onCopyToClipboard}
									showAsExploreMore={
										!spotifyMatches.some((m) => m.isHighQuality !== false)
									}
								/>
							</>
						)}
					</div>
				)}

				{sourcePlatform !== "deezer" && (
					<div>
						{/* Deezer Matches */}
						{hasTrack && (
							<>
								<h3 className="text-2xl font-bold text-secondary mb-4">
									{t("platform.deezer")} Matches
								</h3>
								<DeezerMatchList
									matches={deezerMatches}
									onOpenURL={onOpenURL}
									onCopyToClipboard={onCopyToClipboard}
									showAsExploreMore={
										!deezerMatches.some((m) => m.isHighQuality !== false)
									}
								/>
							</>
						)}
						{hasAlbum &&
							deezerAlbumMatches &&
							deezerAlbumMatches.length > 0 && (
								<>
									<h3 className="text-2xl font-bold text-secondary mb-4">
										{t("platform.deezer")} Album Matches
									</h3>
									<div className="flex flex-col gap-2">
										<p className="text-gray-600 text-sm font-semibold uppercase tracking-wider px-2 mb-2">
											{deezerAlbumMatches.length === 1
												? t("results.topMatch")
												: t("results.otherMatches")}
										</p>
										{deezerAlbumMatches.map((album, index) => (
											<button
												key={album.id}
												type="button"
												onClick={() => onOpenURL(album.link)}
												className={`flex items-center gap-4 px-4 py-3 justify-between rounded-lg transition-opacity hover:opacity-70 ${index === 0
													? "bg-green-50 border-2 border-secondary"
													: "bg-white shadow"
													}`}
											>
												<div className="flex items-center gap-3 flex-1 min-w-0">
													{album.cover && (
														<img
															src={album.cover}
															alt={album.title}
															className="w-10 h-10 rounded flex-shrink-0"
														/>
													)}
													<div className="flex flex-col justify-center flex-1 min-w-0">
														<p className="text-sm font-medium text-gray-900 truncate">
															{album.title}
														</p>
														<p className="text-gray-600 text-xs truncate">
															{album.artist}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2 flex-shrink-0">
													<div
														onClick={(e) => {
															e.stopPropagation();
															onCopyToClipboard(album.link);
														}}
														className="hover:scale-110 transition-transform cursor-pointer"
														role="button"
														tabIndex={0}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.preventDefault();
																e.stopPropagation();
																onCopyToClipboard(album.link);
															}
														}}
													>
														<span className="text-secondary text-xl">
															📋
														</span>
													</div>
													<span className="text-secondary text-xl">✓</span>
												</div>
											</button>
										))}
									</div>
								</>
							)}
						{hasAlbum && deezerMatches.length > 0 && (
							<>
								<h3 className="text-2xl font-bold text-secondary mb-4">
									{t("platform.deezer")} Track Matches
								</h3>
								<DeezerMatchList
									matches={deezerMatches}
									onOpenURL={onOpenURL}
									onCopyToClipboard={onCopyToClipboard}
									showAsExploreMore={
										!deezerMatches.some((m) => m.isHighQuality !== false)
									}
								/>
							</>
						)}
					</div>
				)}

				{sourcePlatform !== "youtubeMusic" && (
					<div>
						{/* YouTube Music Matches */}
						<h3 className="text-2xl font-bold text-youtube mb-4">
							{t("platform.youtube")} Matches
						</h3>
						<YouTubeMusicMatchList
							matches={youtubeMatches}
							onOpenURL={onOpenURL}
							onCopyToClipboard={onCopyToClipboard}
						/>
					</div>
				)}
			</div>

			{/* Action Buttons */}
			<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
				<button
					type="button"
					onClick={onClear}
					className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-green-100 hover:bg-green-200 text-primary font-bold text-base rounded-full transition"
				>
					<span className="text-2xl">➕</span>
					<span>{t("results.clearButton")}</span>
				</button>
			</div>
		</div>
	);
};
