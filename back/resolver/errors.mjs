export class ProviderError extends Error {
	constructor(code, { retryAfterMs, status = 502 } = {}) {
		super(code);
		this.name = 'ProviderError';
		this.code = code;
		this.status = status;
		this.retryAfterMs = retryAfterMs;
	}
}
export function publicError(error) {
	return {
		code:
			error instanceof ProviderError
				? error.code
				: error?.name === 'TimeoutError'
					? 'TIMEOUT'
					: 'PROVIDER_UNAVAILABLE',
		...(error?.retryAfterMs ? { retryAfterMs: error.retryAfterMs } : {}),
	};
}
