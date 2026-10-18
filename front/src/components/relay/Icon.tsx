import type { CSSProperties } from 'react';

const paths = {
	link: 'M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7 7l2-2',
	arrow: 'M5 12h14m-6-6 6 6-6 6',
	external:
		'M14 3h7v7m0-7L10 14 M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5',
	copy: 'M9 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2 M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3',
	search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
	headphones:
		'M3 14v-3a9 9 0 0 1 18 0v3 M3 13h4v8H5a2 2 0 0 1-2-2v-6 M21 13h-4v8h2a2 2 0 0 0 2-2v-6',
	wave: 'M4 10v4m4-8v12m4-15v18m4-15v12m4-8v4',
	play: 'm9 5 11 7-11 7V5',
	check: 'm5 12 4 4L19 6',
	x: 'm6 6 12 12M6 18 18 6',
	plus: 'M12 5v14M5 12h14',
	info: 'M12 16v-4m0-4h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
	help: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4m.1 3h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
	switch: 'M3 7h18m-4-4 4 4-4 4M21 17H3m4-4-4 4 4 4',
	music: 'M9 18V5l12-2v13 M9 18a3 3 0 1 1-3-3h3 M21 16a3 3 0 1 1-3-3h3',
	retry: 'M3 11a9 9 0 1 1 2.7 7M3 4v7h7',
	chevron: 'm6 9 6 6 6-6',
	alert: 'm12 3 10 18H2L12 3 M12 9v4m0 4h.01',
	loader: 'M21 12a9 9 0 1 1-9-9',
};

export type IconName = keyof typeof paths;

export function Icon({
	name,
	style,
}: {
	name: IconName;
	style?: CSSProperties;
}) {
	return (
		<svg
			className={`relay-icon icon-${name}`}
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			style={style}
		>
			<path d={paths[name]} />
		</svg>
	);
}
