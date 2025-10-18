/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				primary: '#1DB954', // Spotify green
				secondary: '#A239FF', // Deezer purple
				youtube: '#FF0000', // YouTube red
			},
		},
	},
	plugins: [],
};
