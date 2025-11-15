export const config = {
	year: 2026,
	startMonth: 'Nov', // central window covers Nov 2025 → Oct 2026
	// Short English month names for the timeline guides (lowercase per spec)
	monthsLabels: ['nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct'],
	ui: {
		font: 'IBM Plex Mono, ui-monospace, SFMono-Regular, monospace',
		colors: {
			accent: '#0009FF',
			gridBg: 'rgba(0,0,255,0.06)',
			gridFocus: 'rgba(0,0,0,0.10)',
			ink: '#1D1D1D',
			panel: 'rgba(255,255,255,0.92)',
		},
		minMonthColWidth: 88, // legacy
		minCol: 56, // dynamic column width clamp (min)
		maxCol: 96, // dynamic column width clamp (max)
		labelMin: 44, // compact label threshold
		centralGutterFade: 0.92, // opacity for soft focus panel
	},
} as const;

export const MONTH_COUNT = 12;
export const LABELS = config.monthsLabels;


