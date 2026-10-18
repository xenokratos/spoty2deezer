import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createResolver } from '../resolver/index.mjs';
import serverModule from '../server.js';
import { candidate, spotifyId, track } from './fixtures.mjs';

async function serve(t, resolver, options = {}) {
	const app = await serverModule.createApp({
		resolver,
		logger: () => {},
		...options,
	});
	const server = app.listen(0, '127.0.0.1');
	await once(server, 'listening');
	t.after(
		() =>
			new Promise((resolve) => {
				server.closeAllConnections();
				server.close(resolve);
			}),
	);
	return `http://127.0.0.1:${server.address().port}`;
}
test('HTTP endpoint returns the normalized contract, rejects invalid input, and retires the generic proxy', async (t) => {
	const providers = {
		spotify: { get: async () => track() },
		deezer: { search: async () => ({ candidates: [candidate()] }) },
		youtubeMusic: { search: async () => ({ candidates: [] }) },
	};
	const base = await serve(t, createResolver({ providers, logger: () => {} }));
	const response = await fetch(`${base}/api/resolve`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url: `spotify:track:${spotifyId}` }),
	});
	assert.equal(response.status, 200);
	assert.equal(response.headers.get('cache-control'), 'no-store');
	const data = await response.json();
	assert.equal(data.schemaVersion, 1);
	assert.equal(data.source.artist, 'Charles Aznavour');
	assert.equal(data.destinations[0].status, 'identifier_match');
	const invalid = await fetch(`${base}/api/resolve`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url: 'https://localhost/private' }),
	});
	assert.equal(invalid.status, 400);
	assert.deepEqual(await invalid.json(), { error: { code: 'INVALID_INPUT' } });
	assert.equal(
		(await fetch(`${base}/proxy?url=https://api.deezer.com/track/1`)).status,
		404,
	);
	const malformed = await fetch(`${base}/api/resolve`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: '{broken',
	});
	assert.equal(malformed.status, 400);
});
test('disconnecting an HTTP client aborts resolver work', async (t) => {
	let started, cancelled;
	const start = new Promise((resolve) => {
		started = resolve;
	});
	const stop = new Promise((resolve) => {
		cancelled = resolve;
	});
	const base = await serve(t, {
		resolve: async (_input, { signal }) => {
			started();
			await new Promise((_resolve, reject) =>
				signal.addEventListener(
					'abort',
					() => {
						cancelled();
						reject(signal.reason);
					},
					{ once: true },
				),
			);
		},
	});
	const controller = new AbortController();
	const request = fetch(`${base}/api/resolve`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url: `spotify:track:${spotifyId}` }),
		signal: controller.signal,
	});
	await start;
	controller.abort();
	await assert.rejects(request);
	await stop;
});

test('the temporary legacy route is opt-in and never exposes credential endpoints', async (t) => {
	let calls = 0;
	const base = await serve(
		t,
		{ capabilities: {} },
		{
			legacyProxy: true,
			legacyHttp: {
				get: async () => {
					calls++;
					return { title: 'Legacy source' };
				},
			},
		},
	);
	const response = await fetch(
		`${base}/proxy?url=${encodeURIComponent('https://open.spotify.com/oembed?url=track')}`,
	);
	assert.equal(response.status, 200);
	assert.equal(response.headers.get('deprecation'), 'true');
	assert.equal((await response.json()).title, 'Legacy source');
	const rejected = await fetch(
		`${base}/proxy?url=${encodeURIComponent('https://accounts.spotify.com/api/token')}`,
	);
	assert.equal(rejected.status, 400);
	assert.equal(calls, 1);
});
