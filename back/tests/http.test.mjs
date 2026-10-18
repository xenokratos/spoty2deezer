import assert from 'node:assert/strict';
import test from 'node:test';
import { createHttp, validateTarget } from '../resolver/http.mjs';

test('every redirect is validated before another network call', async () => {
	let calls = 0;
	const http = createHttp({
		transport: {
			request: async () => {
				calls++;
				return {
					status: 302,
					headers: { location: 'http://127.0.0.1/private' },
				};
			},
		},
	});
	await assert.rejects(http.get('https://link.deezer.com/s/abc'), {
		code: 'INVALID_UPSTREAM_URL',
	});
	assert.equal(calls, 1);
	assert.throws(() =>
		validateTarget('https://api.deezer.com.evil.test/track/1'),
	);
});
test('rate limits respect Retry-After and avoid repeated requests during cooldown', async () => {
	let now = 0,
		calls = 0;
	const http = createHttp({
		now: () => now,
		transport: {
			request: async () => {
				calls++;
				return calls === 1
					? { status: 429, headers: { 'retry-after': '2' } }
					: { status: 200, headers: {}, data: 'ok' };
			},
		},
	});
	await assert.rejects(http.get('https://api.deezer.com/track/1'), {
		code: 'RATE_LIMITED',
		retryAfterMs: 2000,
	});
	await assert.rejects(http.get('https://api.deezer.com/track/1'), {
		code: 'RATE_LIMITED',
	});
	assert.equal(calls, 1);
	now = 2001;
	assert.equal(await http.get('https://api.deezer.com/track/1'), 'ok');
});
test('transient server errors retry once, while cancellation stops immediately', async () => {
	let calls = 0;
	const http = createHttp({
		transport: {
			request: async () => {
				calls++;
				return {
					status: calls === 1 ? 503 : 200,
					headers: {},
					data: 'recovered',
				};
			},
		},
	});
	assert.equal(await http.get('https://api.deezer.com/track/1'), 'recovered');
	assert.equal(calls, 2);
	const controller = new AbortController();
	controller.abort();
	await assert.rejects(
		http.get('https://api.deezer.com/track/1', { signal: controller.signal }),
		{ name: 'AbortError' },
	);
	assert.equal(calls, 2);
});

test('credential sensitivity survives same-host redirects and header case changes', async () => {
	for (const options of [
		{ headers: { authorization: 'Bearer test' } },
		{ params: { key: 'test' } },
	]) {
		let calls = 0;
		const http = createHttp({
			transport: {
				request: async () => {
					calls++;
					return {
						status: 302,
						headers: {
							location:
								calls === 1
									? 'https://www.googleapis.com/next?key=test'
									: 'https://api.deezer.com/collect?key=test',
						},
					};
				},
			},
		});
		await assert.rejects(
			http.get('https://www.googleapis.com/search', options),
			{ code: 'INVALID_UPSTREAM_REDIRECT' },
		);
		assert.equal(calls, 2);
	}
});
test('long Retry-After cooldowns are not shortened', async () => {
	let now = 0,
		calls = 0;
	const http = createHttp({
		now: () => now,
		transport: {
			request: async () => {
				calls++;
				return { status: 429, headers: { 'retry-after': '3600' } };
			},
		},
	});
	await assert.rejects(http.get('https://api.deezer.com/track/1'), {
		retryAfterMs: 3600000,
	});
	now = 300001;
	await assert.rejects(http.get('https://api.deezer.com/track/1'), {
		code: 'RATE_LIMITED',
	});
	assert.equal(calls, 1);
});

test('concurrent 429 responses cannot shorten another request cooldown', async () => {
	let now = 0,
		calls = 0;
	const replies = [];
	const http = createHttp({
		now: () => now,
		transport: {
			request: async () => {
				calls++;
				return new Promise((resolve) => replies.push(resolve));
			},
		},
	});
	const first = http.get('https://api.deezer.com/track/1');
	const second = http.get('https://api.deezer.com/track/2');
	replies[0]({ status: 429, headers: { 'retry-after': '3600' } });
	await assert.rejects(first, { retryAfterMs: 3600000 });
	replies[1]({ status: 429, headers: { 'retry-after': '1' } });
	await assert.rejects(second, { retryAfterMs: 3600000 });
	now = 2000;
	await assert.rejects(http.get('https://api.deezer.com/track/3'), {
		code: 'RATE_LIMITED',
	});
	assert.equal(calls, 2);
});
