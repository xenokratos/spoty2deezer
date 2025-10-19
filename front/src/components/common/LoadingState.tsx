export const LoadingState = () => {
	return (
		<div className="bg-white p-6 md:p-8 rounded-lg shadow-lg mb-8">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-semibold text-gray-900">
					Conversion Progress
				</h2>
				<div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
			</div>
			<div className="w-full bg-gray-100 rounded-full h-2.5">
				<div className="bg-primary h-2.5 rounded-full w-1/2" />
			</div>
			<p className="mt-4 text-center text-gray-600">Converting your track...</p>
		</div>
	);
};
