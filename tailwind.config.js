/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./index.html',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				accent: '#0009FF',
				gridBg: 'rgba(0,0,255,0.06)',
				gridFocus: 'rgba(0,0,0,0.10)',
				ink: '#1D1D1D',
				panel: 'rgba(255,255,255,0.92)',
			},
			fontFamily: {
				mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
			},
		},
	},
	plugins: [],
};


