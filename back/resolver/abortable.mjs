/** Bound the wait even if an adapter accidentally ignores its cancellation signal. */
export function abortable(work, signal) {
	signal.throwIfAborted();
	return new Promise((resolve, reject) => {
		const abort = () => {
			signal.removeEventListener('abort', abort);
			reject(signal.reason);
		};
		signal.addEventListener('abort', abort, { once: true });
		Promise.resolve()
			.then(() => {
				signal.throwIfAborted();
				return work();
			})
			.then(
				(value) => {
					signal.removeEventListener('abort', abort);
					resolve(value);
				},
				(error) => {
					signal.removeEventListener('abort', abort);
					reject(error);
				},
			);
	});
}
