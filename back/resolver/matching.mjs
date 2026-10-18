export function normalize(value = '') {
	return value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}
function similarity(left, right) {
	const a = normalize(left),
		b = normalize(right);
	if (!a || !b) return 0;
	if (a === b) return 1;
	const x = new Set(a.split(' ')),
		y = new Set(b.split(' '));
	return (2 * [...x].filter((t) => y.has(t)).length) / (x.size + y.size);
}
function versions(title) {
	const contexts = [
		...title.matchAll(/\(([^)]*)\)|\[([^\]]*)\]|\s[-–—]\s(.+)$/g),
	].map((m) => normalize(m[1] ?? m[2] ?? m[3]));
	const trailing = normalize(title).match(
		/ ((?:(?:19|20)\d{2} )?(?:live(?: at .+| in .+| from .+)?|acoustic|instrumental|karaoke|remix|remaster(?:ed)?(?: \d{4})?))$/,
	)?.[1];
	if (trailing && !contexts.includes(trailing)) contexts.push(trailing);
	const markers = [
		'live',
		'acoustic',
		'remix',
		'instrumental',
		'karaoke',
		'cover',
		'remaster',
		'sped up',
		'slowed',
	];
	return contexts
		.filter((context) =>
			markers.some((v) =>
				new RegExp(`\\b${v}${v === 'remaster' ? '(?:ed)?' : ''}\\b`).test(
					context,
				),
			),
		)
		.map((context) =>
			context
				.replace(/\bremastered\b/g, 'remaster')
				.split(' ')
				.sort()
				.join(' '),
		)
		.sort();
}
const code = (value) =>
	typeof value === 'string'
		? value.toUpperCase().replace(/[^A-Z0-9]/g, '')
		: '';
export function scoreMatch(source, candidate) {
	const reasons = [];
	if (source.kind !== candidate.kind || candidate.isPlayable === false)
		return {
			score: 0,
			method: 'metadata',
			reasons: ['unavailable_or_wrong_type'],
		};
	const title = similarity(source.title, candidate.title);
	const artist = similarity(source.artist, candidate.artist);
	let score = title * 0.5 + artist * 0.5;
	const sourceVersions = versions(source.title),
		candidateVersions = versions(candidate.title);
	const sameVersion = sourceVersions.join('|') === candidateVersions.join('|');
	const identifier =
		source.kind === 'track' ? code(source.isrc) : code(source.upc);
	const other =
		source.kind === 'track' ? code(candidate.isrc) : code(candidate.upc);
	const identical = Boolean(identifier && identifier === other);
	if (identical) {
		score = 1;
		reasons.push(source.kind === 'track' ? 'same_isrc' : 'same_upc');
	}
	if (source.artist && candidate.artist && artist < 0.5) {
		score = Math.min(score, 0.3);
		reasons.push('different_artist');
	}
	if (!sameVersion) {
		score = Math.min(score, 0.65);
		reasons.push('different_version');
	}
	if (source.durationMs && candidate.durationMs) {
		const difference = Math.abs(source.durationMs - candidate.durationMs);
		if (difference <= 3000) {
			score = Math.min(1, score + 0.04);
			reasons.push('similar_duration');
		} else if (difference > 15000) {
			score = Math.min(score, 0.45);
			reasons.push('different_duration');
		}
	}
	if (source.kind === 'album') {
		if (
			source.trackCount &&
			candidate.trackCount &&
			source.trackCount !== candidate.trackCount
		) {
			score = Math.min(score, 0.65);
			reasons.push('different_track_count');
		}
		if (
			source.tracks?.length &&
			candidate.tracks?.length &&
			source.tracksComplete !== false &&
			candidate.tracksComplete !== false
		) {
			const titles = new Set(candidate.tracks.map((t) => normalize(t.title)));
			const overlap =
				source.tracks.filter((t) => titles.has(normalize(t.title))).length /
				Math.max(source.tracks.length, candidate.tracks.length);
			if (overlap < 0.8) {
				score = Math.min(score, 0.45);
				reasons.push('different_track_list');
			} else reasons.push('similar_track_list');
		}
	}
	if (identifier && other && identifier !== other) {
		score = Math.min(score, 0.7);
		reasons.push('different_identifier');
	}
	if (source.kind === 'album') {
		const complete =
			source.tracks?.length &&
			candidate.tracks?.length &&
			source.tracksComplete !== false &&
			candidate.tracksComplete !== false;
		if (!identical && !complete) score = Math.min(score, 0.85);
		if (source.tracks?.length && candidate.tracks?.length) {
			let conflicts = 0;
			const remaining = [...candidate.tracks];
			const originals = source.tracks
				.map((original) => ({
					original,
					priority: code(original.isrc)
						? candidate.tracks.some(
								(t) =>
									normalize(t.title) === normalize(original.title) &&
									code(t.isrc) === code(original.isrc),
							)
							? 2
							: 1
						: 0,
				}))
				.sort((a, b) => b.priority - a.priority);
			for (const { original } of originals) {
				const possible = remaining.filter(
					(t) => normalize(t.title) === normalize(original.title),
				);
				const otherTrack =
					possible.find(
						(t) => code(original.isrc) && code(t.isrc) === code(original.isrc),
					) ??
					possible.sort(
						(a, b) =>
							Math.abs(
								(a.durationMs ?? original.durationMs ?? 0) -
									(original.durationMs ?? 0),
							) -
							Math.abs(
								(b.durationMs ?? original.durationMs ?? 0) -
									(original.durationMs ?? 0),
							),
					)[0];
				if (!otherTrack) continue;
				remaining.splice(remaining.indexOf(otherTrack), 1);
				if (
					(code(original.isrc) &&
						code(otherTrack.isrc) &&
						code(original.isrc) !== code(otherTrack.isrc)) ||
					(original.durationMs &&
						otherTrack.durationMs &&
						Math.abs(original.durationMs - otherTrack.durationMs) > 15000)
				)
					conflicts++;
			}
			if (conflicts) {
				score = Math.min(score, 0.45);
				reasons.push('different_recordings');
			}
		}
	}
	if (!source.artist || !candidate.artist) {
		score = Math.min(score, 0.7);
		reasons.push('incomplete_artist');
	}
	const method = identical && score >= 0.9 ? 'identifier' : 'metadata';
	if (title === 1) reasons.push('same_title');
	return { score, method, reasons };
}
export function rankMatches(source, candidates) {
	const unique = new Map();
	for (const candidate of candidates) {
		const match = scoreMatch(source, candidate);
		if (match.score < 0.5) continue;
		const value = { ...candidate, quality: match.score >= 0.9, match };
		const previous = unique.get(candidate.url);
		if (!previous || previous.match.score < match.score)
			unique.set(candidate.url, value);
	}
	return [...unique.values()]
		.sort(
			(a, b) =>
				Number(b.match.method === 'identifier') -
					Number(a.match.method === 'identifier') ||
				b.match.score - a.match.score,
		)
		.slice(0, 5);
}
