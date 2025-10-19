export const SupportedFormats = () => {
	return (
		<div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
			<h2 className="text-2xl font-semibold text-gray-900 mb-4">
				Supported Conversions
			</h2>
			<p className="text-gray-600 mb-6">
				Paste a music link from Spotify or Deezer to get matches on Deezer and
				YouTube Music!
			</p>
			<div className="space-y-3">
				<div>
					<h3 className="font-medium text-gray-900 mb-2">🎵 Spotify Input</h3>
					<div className="space-y-1 ml-4">
						<code className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded block">
							https://open.spotify.com/track/{'{track-id}'}
						</code>
						<code className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded block">
							spotify:track:{'{track-id}'}
						</code>
					</div>
				</div>
				<div>
					<h3 className="font-medium text-gray-900 mb-2">🎶 Deezer Input</h3>
					<div className="space-y-1 ml-4">
						<code className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded block">
							https://www.deezer.com/track/{'{track-id}'}
						</code>
						<code className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded block">
							https://link.deezer.com/s/{'{short-code}'}
						</code>
					</div>
				</div>
			</div>
			<div className="mt-6 p-3 bg-green-50 rounded-md">
				<p className="text-sm text-green-800">
					<strong>Results:</strong> Get matches on Deezer and YouTube Music for
					any supported input
				</p>
			</div>
		</div>
	);
};
