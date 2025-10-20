import { useState } from "react";
import { useDeezerToSpotify } from "../../hooks/useDeezerToSpotify";
import { useDeezerToYouTubeMusic } from "../../hooks/useDeezerToYouTubeMusic";
import { useSpotifyToDeezer } from "../../hooks/useSpotifyToDeezer";
import { useSpotifyToYouTubeMusic } from "../../hooks/useSpotifyToYouTubeMusic";
import { useYouTubeMusicToDeezer } from "../../hooks/useYouTubeMusicToDeezer";
import { useYouTubeMusicToSpotify } from "../../hooks/useYouTubeMusicToSpotify";
import type { DeezerAlbum, DeezerTrack } from "../../types/deezer.types";
import type { SpotifyAlbum, SpotifyTrack } from "../../types/spotify.types";
import type { YouTubeMusicTrack } from "../../types/youtubeMusic.types";
import { detectPlatform } from "../../utils/urlParser";
import { ConversionForm } from "../common/ConversionForm";
import { Footer } from "../common/Footer";
import { Header } from "../common/Header";
import { LoadingState } from "../common/LoadingState";
import { SupportedFormats } from "../common/SupportedFormats";
import { ConversionResults } from "./ConversionResults";

interface ConversionState {
	sourceTrack?: SpotifyTrack | DeezerTrack | YouTubeMusicTrack;
	sourceAlbum?: SpotifyAlbum | DeezerAlbum;
	sourcePlatform: "spotify" | "deezer" | "youtubeMusic";
	deezerMatches: DeezerTrack[];
	deezerAlbumMatches?: DeezerAlbum[];
	youtubeMatches: YouTubeMusicTrack[];
	spotifyMatches: SpotifyTrack[];
	spotifyAlbumMatches?: SpotifyAlbum[];
}

export const LinkConverter = () => {
	const [inputUrl, setInputUrl] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [result, setResult] = useState<ConversionState | null>(null);

	// Conversion hooks
	const { convert: convertSpotifyToDeezer } = useSpotifyToDeezer();
	const { convert: convertSpotifyToYouTubeMusic } = useSpotifyToYouTubeMusic();
	const { convert: convertDeezerToYouTubeMusic } = useDeezerToYouTubeMusic();
	const { convert: convertDeezerToSpotify } = useDeezerToSpotify();
	const { convert: convertYouTubeMusicToDeezer } = useYouTubeMusicToDeezer();
	const { convert: convertYouTubeMusicToSpotify } = useYouTubeMusicToSpotify();

	const handleConvert = (): void => {
		if (!inputUrl.trim()) {
			setError("form.error.empty");
			return;
		}

		const platform = detectPlatform(inputUrl);
		if (
			!platform ||
			(platform !== "spotify" &&
				platform !== "deezer" &&
				platform !== "youtubeMusic")
		) {
			setError("form.error.invalid");
			return;
		}

		setLoading(true);
		setError("");
		setResult(null);

		// Route to appropriate conversion based on detected platform
		switch (platform) {
			case "spotify":
				handleSpotifyConversion(inputUrl);
				break;
			case "deezer":
				handleDeezerConversion(inputUrl);
				break;
			case "youtubeMusic":
				handleYouTubeMusicConversion(inputUrl);
				break;
		}
	};

	const handleSpotifyConversion = (url: string): void => {
		Promise.all([
			convertSpotifyToDeezer(url),
			convertSpotifyToYouTubeMusic(url),
		])
			.then(([deezerResult, youtubeResult]) => {
				setResult({
					sourceTrack: deezerResult.spotifyTrack,
					sourceAlbum: deezerResult.spotifyAlbum,
					sourcePlatform: "spotify",
					deezerMatches: deezerResult.deezerMatches,
					deezerAlbumMatches: deezerResult.deezerAlbumMatches,
					youtubeMatches: youtubeResult.youtubeMatches,
					spotifyMatches: [],
					spotifyAlbumMatches: [],
				});
				setLoading(false);
			})
			.catch((err) => {
				const errorMessage =
					err instanceof Error ? err.message : "error.unknown";
				setError(errorMessage);
				setLoading(false);
			});
	};

	const handleDeezerConversion = (url: string): void => {
		Promise.all([
			convertDeezerToYouTubeMusic(url),
			convertDeezerToSpotify(url),
		])
			.then(([youtubeResult, spotifyResult]) => {
				setResult({
					sourceTrack: youtubeResult.deezerTrack,
					sourcePlatform: "deezer",
					deezerMatches: [], // No need to show Deezer matches for Deezer source
					youtubeMatches: youtubeResult.youtubeMatches,
					spotifyMatches: spotifyResult.spotifyMatches,
					spotifyAlbumMatches: [],
				});
				setLoading(false);
			})
			.catch((err) => {
				const errorMessage =
					err instanceof Error ? err.message : "error.unknown";
				setError(errorMessage);
				setLoading(false);
			});
	};

	const handleYouTubeMusicConversion = (url: string): void => {
		Promise.all([
			convertYouTubeMusicToSpotify(url),
			convertYouTubeMusicToDeezer(url),
		])
			.then(([spotifyResult, deezerResult]) => {
				setResult({
					sourceTrack: spotifyResult.youtubeMusicTrack,
					sourcePlatform: "youtubeMusic",
					deezerMatches: deezerResult.deezerMatches,
					youtubeMatches: [], // No need to show YouTube Music matches for YouTube Music source
					spotifyMatches: spotifyResult.spotifyMatches,
					spotifyAlbumMatches: [],
					deezerAlbumMatches: [],
				});
				setLoading(false);
			})
			.catch((err) => {
				const errorMessage =
					err instanceof Error ? err.message : "error.unknown";
				setError(errorMessage);
				setLoading(false);
			});
	};

	const handleClear = (): void => {
		setInputUrl("");
		setError("");
		setResult(null);
	};

	const handleOpenURL = (url: string): void => {
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const handleCopyToClipboard = (text: string): void => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				// Success
			})
			.catch(() => {
				// Error handling if needed
			});
	};

	return (
		<div className="flex-1 bg-gray-50 min-h-screen">
			<div className="min-h-screen flex items-center justify-center p-4 md:p-8">
				<div className="w-full max-w-2xl mx-auto">
					<Header />

					<ConversionForm
						value={inputUrl}
						onChange={setInputUrl}
						onConvert={handleConvert}
						loading={loading}
						error={error}
					/>

					{loading && <LoadingState />}

					{result && !loading && (
						<ConversionResults
							sourceTrack={result.sourceTrack}
							sourceAlbum={result.sourceAlbum}
							sourcePlatform={result.sourcePlatform}
							deezerMatches={result.deezerMatches}
							deezerAlbumMatches={result.deezerAlbumMatches}
							youtubeMatches={result.youtubeMatches}
							spotifyMatches={result.spotifyMatches || []}
							spotifyAlbumMatches={result.spotifyAlbumMatches}
							onClear={handleClear}
							onOpenURL={handleOpenURL}
							onCopyToClipboard={handleCopyToClipboard}
						/>
					)}

					{!result && !loading && <SupportedFormats />}

					<Footer />
				</div>
			</div>
		</div>
	);
};

export default LinkConverter;
