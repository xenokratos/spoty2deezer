import type { DeezerTrack } from "../../types/deezer.types";
import type { SpotifyTrack } from "../../types/spotify.types";
import type { YouTubeMusicTrack } from "../../types/youtubeMusic.types";

interface SourceTrackCardProps {
	track: SpotifyTrack | DeezerTrack | YouTubeMusicTrack;
}

export const SourceTrackCard = ({ track }: SourceTrackCardProps) => {
	// Determine platform and normalize data
	let platformName = "Unknown";
	let trackName = "";
	let artists: string[] = [];
	let album = "";
	let imageUrl = "";

	if ("external_urls" in track && "spotify" in track.external_urls) {
		// Spotify track
		platformName = "Spotify";
		trackName = track.name;
		artists = track.artists;
		album = "album" in track ? track.album || "" : "";
		imageUrl = track.images?.[0]?.url || "";
	} else if ("cover" in track) {
		// Deezer track
		platformName = "Deezer";
		trackName = track.title;
		artists = [track.artist];
		album = track.album;
		imageUrl = track.cover;
	} else if ("channel" in track) {
		// YouTube Music track
		platformName = "YouTube Music";
		trackName = track.name;
		artists = track.artists;
		album = ""; // YouTube Music doesn't provide album info
		imageUrl = track.thumbnail || "";
	}

	return (
		<div className="mb-8 bg-white p-6 rounded-xl shadow-lg">
			<h3 className="text-xl font-semibold text-gray-900 mb-4">
				Source Track ({platformName})
			</h3>
			<div className="flex items-center gap-4">
				{imageUrl && (
					<img src={imageUrl} alt={trackName} className="w-24 h-24 rounded" />
				)}
				<div className="flex-1">
					<h4 className="text-2xl font-bold text-gray-900">{trackName}</h4>
					<p className="text-lg text-gray-600">{artists.join(", ")}</p>
					{album && (
						<p className="text-sm text-gray-500 mt-1">Album: {album}</p>
					)}
				</div>
			</div>
		</div>
	);
};
