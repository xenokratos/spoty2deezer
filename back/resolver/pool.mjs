import { ProviderError } from './errors.mjs';

/** Deduplicate work while allowing each caller to cancel independently. */
export class ResolutionPool {
	constructor({
		maxEntries = 200,
		maxInflight = 32,
		ttlMs = 300000,
		now = Date.now,
	} = {}) {
		this.cache = new Map();
		this.inflight = new Map();
		this.maxEntries = maxEntries;
		this.maxInflight = maxInflight;
		this.ttlMs = ttlMs;
		this.now = now;
	}
	run(key, work, { signal, cacheable = () => true } = {}) {
		signal?.throwIfAborted();
		const cached = this.cache.get(key);
		if (cached && cached.expires > this.now())
			return Promise.resolve(structuredClone(cached.value));
		this.cache.delete(key);
		let entry = this.inflight.get(key);
		if (!entry) {
			if (this.inflight.size >= this.maxInflight)
				return Promise.reject(
					new ProviderError('RESOLVER_BUSY', { status: 503 }),
				);
			entry = {
				controller: new AbortController(),
				subscribers: 0,
				settled: false,
			};
			this.inflight.set(key, entry);
			entry.promise = Promise.resolve()
				.then(() => work(entry.controller.signal))
				.then((value) => {
					if (
						!entry.controller.signal.aborted &&
						this.ttlMs > 0 &&
						cacheable(value)
					) {
						this.cache.delete(key);
						this.cache.set(key, {
							value: structuredClone(value),
							expires: this.now() + this.ttlMs,
						});
						while (this.cache.size > this.maxEntries)
							this.cache.delete(this.cache.keys().next().value);
					}
					return value;
				})
				.finally(() => {
					entry.settled = true;
					if (this.inflight.get(key) === entry) this.inflight.delete(key);
				});
		}
		entry.subscribers++;
		return new Promise((resolve, reject) => {
			let finished = false;
			const finish = (callback, value) => {
				if (finished) return;
				finished = true;
				signal?.removeEventListener('abort', cancel);
				entry.subscribers--;
				callback(value);
				if (!entry.settled && entry.subscribers === 0) {
					entry.controller.abort(
						new DOMException('No active callers', 'AbortError'),
					);
					if (this.inflight.get(key) === entry) this.inflight.delete(key);
				}
			};
			const cancel = () => finish(reject, signal.reason);
			signal?.addEventListener('abort', cancel, { once: true });
			entry.promise.then(
				(value) => finish(resolve, structuredClone(value)),
				(error) => finish(reject, error),
			);
			if (signal?.aborted) cancel();
		});
	}
}
