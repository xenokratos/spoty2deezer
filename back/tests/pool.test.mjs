import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { ResolutionPool } from '../resolver/pool.mjs';

test('concurrent callers share work; one cancellation leaves the other caller alive', async () => {
	const pool = new ResolutionPool();
	let calls = 0;
	const work = async (signal) => {
		calls++;
		await delay(20, undefined, { signal });
		return { value: 1 };
	};
	const a = new AbortController(),
		b = new AbortController();
	const first = pool.run('same', work, { signal: a.signal });
	const second = pool.run('same', work, { signal: b.signal });
	a.abort();
	await assert.rejects(first, { name: 'AbortError' });
	assert.deepEqual(await second, { value: 1 });
	assert.equal(calls, 1);
	const cached = await pool.run('same', work);
	cached.value = 9;
	assert.equal((await pool.run('same', work)).value, 1);
	assert.equal(calls, 1);
});
test('the last cancellation aborts upstream work and allows a fresh retry', async () => {
	const pool = new ResolutionPool();
	let upstream;
	const controller = new AbortController();
	const promise = pool.run(
		'cancel',
		async (signal) => {
			upstream = signal;
			await delay(1000, undefined, { signal });
		},
		{ signal: controller.signal },
	);
	await Promise.resolve();
	controller.abort();
	await assert.rejects(promise);
	assert.equal(upstream.aborted, true);
	assert.equal(await pool.run('cancel', async () => 'retry'), 'retry');
});
test('failures are not cached; cache entries expire and remain bounded', async () => {
	let now = 0,
		calls = 0;
	const pool = new ResolutionPool({ maxEntries: 2, ttlMs: 10, now: () => now });
	const work = async () => ++calls;
	await pool.run('a', work);
	await pool.run('b', work);
	await pool.run('c', work);
	assert.equal(pool.cache.size, 2);
	await pool.run('a', work);
	assert.equal(calls, 4);
	now = 11;
	await pool.run('a', work);
	assert.equal(calls, 5);
	await pool.run('failure', work, { cacheable: () => false });
	await pool.run('failure', work);
	assert.equal(calls, 7);
	await assert.rejects(
		pool.run('reject', async () => {
			throw new Error('fail');
		}),
	);
	assert.equal(await pool.run('reject', async () => 'recovered'), 'recovered');
});
