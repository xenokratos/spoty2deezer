import assert from 'node:assert/strict';
import test from 'node:test';
import { rankMatches, scoreMatch } from '../resolver/matching.mjs';
import { candidate, track } from './fixtures.mjs';

test('matching recording identifiers outrank textual variants', () => {
	const result = rankMatches(track(), [
		candidate({ title: 'La Boheme', isrc: undefined }),
		candidate({ id: '456', url: 'https://www.deezer.com/track/456' }),
	]);
	assert.equal(result[0].id, '456');
	assert.equal(result[0].match.method, 'identifier');
	assert.equal(result[0].quality, true);
});
test('a cover by another artist is excluded even when the title is identical', () => {
	assert.deepEqual(
		rankMatches(track(), [
			candidate({ artist: 'Solann', artists: ['Solann'], isrc: 'different' }),
		]),
		[],
	);
});
test('live and remastered versions do not become high-confidence matches, even with reused ISRC', () => {
	for (const title of ['La bohème (Live)', 'La bohème - Remastered 2024']) {
		const result = rankMatches(track(), [candidate({ title })]);
		assert.equal(result[0].quality, false);
		assert.equal(result[0].match.method, 'metadata');
		assert.ok(result[0].match.reasons.includes('different_version'));
	}
});
test('duration uses milliseconds consistently and penalizes materially different recordings', () => {
	assert.equal(scoreMatch(track(), candidate({ durationMs: 246000 })).score, 1);
	assert.deepEqual(
		rankMatches(track(), [candidate({ durationMs: 120000 })]),
		[],
	);
});
test('album editions compare track counts and track lists before being trusted', () => {
	const source = track({
		kind: 'album',
		upc: '12345',
		trackCount: 2,
		tracks: [{ title: 'Song A' }, { title: 'Song B' }],
	});
	const wrongEdition = candidate({
		kind: 'album',
		upc: '12345',
		trackCount: 3,
		tracks: [{ title: 'Song A' }, { title: 'Different' }, { title: 'Bonus' }],
	});
	assert.deepEqual(rankMatches(source, [wrongEdition]), []);
	assert.equal(
		rankMatches(source, [
			candidate({ ...wrongEdition, trackCount: 2, tracks: source.tracks }),
		])[0].match.method,
		'identifier',
	);
});
test('unknown artists, unavailable recordings and duplicate links are handled honestly', () => {
	assert.equal(
		rankMatches(track({ artist: '', artists: [], isrc: undefined }), [
			candidate(),
		])[0].quality,
		false,
	);
	assert.deepEqual(
		rankMatches(track(), [candidate({ isPlayable: false })]),
		[],
	);
	assert.equal(rankMatches(track(), [candidate(), candidate()]).length, 1);
});

test('conflicting identifiers and different remaster years remain untrusted', () => {
	assert.equal(
		rankMatches(track(), [candidate({ isrc: 'FRZ116500011' })])[0].quality,
		false,
	);
	const remaster = track({ title: 'Song (2011 Remaster)' });
	assert.equal(
		rankMatches(remaster, [candidate({ title: 'Song (2024 Remaster)' })])[0]
			.quality,
		false,
	);
});
test('a song whose title contains Live does not disguise a live version', () => {
	const original = track({ title: 'Live Forever', isrc: undefined });
	assert.equal(
		rankMatches(original, [
			candidate({ title: 'Live Forever (Live)', isrc: undefined }),
		])[0].quality,
		false,
	);
});
test('album track identities and durations override matching track titles', () => {
	const source = track({
		kind: 'album',
		upc: '12345',
		trackCount: 1,
		tracks: [{ title: 'Song', isrc: 'FRZ116500010', durationMs: 180000 }],
	});
	const other = candidate({
		kind: 'album',
		upc: '54321',
		trackCount: 1,
		tracks: [{ title: 'Song', isrc: 'FRZ116500011', durationMs: 360000 }],
	});
	assert.deepEqual(rankMatches(source, [other]), []);
});
test('a partial album track list is not mistaken for a different release', () => {
	const source = track({
		kind: 'album',
		upc: '12345',
		trackCount: 2,
		tracks: [{ title: 'A' }, { title: 'B' }],
	});
	const other = candidate({
		kind: 'album',
		upc: '12345',
		trackCount: 2,
		tracks: [{ title: 'A' }],
		tracksComplete: false,
	});
	assert.equal(rankMatches(source, [other])[0].match.method, 'identifier');
});

test('live venue and unbracketed remaster-year differences stay untrusted', () => {
	for (const [a, b] of [
		['Song (Live at Wembley)', 'Song (Live at Paris)'],
		[
			'Shine On You Crazy Diamond 2011 Remaster',
			'Shine On You Crazy Diamond 2020 Remaster',
		],
	]) {
		const result = rankMatches(track({ title: a, isrc: undefined }), [
			candidate({ title: b, isrc: undefined }),
		]);
		assert.equal(result[0].quality, false);
	}
});
test('duplicate album track titles are assigned one-to-one by recording identity', () => {
	const tracks = [
		{ title: 'Intro', isrc: 'FRZ116500010' },
		{ title: 'Intro', isrc: 'FRZ116500011' },
	];
	const source = track({ kind: 'album', upc: '12345', trackCount: 2, tracks });
	const target = candidate({
		kind: 'album',
		upc: '12345',
		trackCount: 2,
		tracks: [...tracks].reverse(),
	});
	assert.equal(rankMatches(source, [target])[0].match.method, 'identifier');
});

test('known recording matches are reserved before duplicate tracks without identifiers', () => {
	const source = track({
		kind: 'album',
		upc: '12345',
		trackCount: 2,
		tracks: [{ title: 'Intro' }, { title: 'Intro', isrc: 'BBB' }],
	});
	const target = candidate({
		kind: 'album',
		upc: '12345',
		trackCount: 2,
		tracks: [
			{ title: 'Intro', isrc: 'BBB' },
			{ title: 'Intro', isrc: 'AAA' },
		],
	});
	assert.equal(rankMatches(source, [target])[0].match.method, 'identifier');
});
