import assert from 'node:assert/strict';
import test from 'node:test';
import deezer from '../src/services/deezerService.ts';

const source = { name: 'Song', artists: ['Artist'] };

test('an unavailable Deezer search is not reported as an empty catalog result', async () => {
	const original = deezer.searchTrack;
	const offline = new Error('service unavailable');
	deezer.searchTrack = async () => {
		throw offline;
	};
	try {
		await assert.rejects(() => deezer.findTrackMatches(source), offline);
	} finally {
		deezer.searchTrack = original;
	}
});

test('a successful search with no matches is a genuine empty result', async () => {
	const original = deezer.searchTrack;
	deezer.searchTrack = async () => [];
	try {
		assert.deepEqual(await deezer.findTrackMatches(source), []);
	} finally {
		deezer.searchTrack = original;
	}
});

test('one successful fallback query is sufficient to return an empty result', async () => {
	const original = deezer.searchTrack;
	let calls = 0;
	deezer.searchTrack = async () => {
		calls += 1;
		if (calls === 1) throw new Error('query failed');
		return [];
	};
	try {
		assert.deepEqual(await deezer.findTrackMatches(source), []);
	} finally {
		deezer.searchTrack = original;
	}
});
