export type Layout = {
	viewportWidth: number;
	monthWidth: number; // computed actual width per month column (>= min)
	offsetX: number; // left offset of first month column inside central window
	scrollX: number; // horizontal scroll of central window (0 when all fit)
	monthCount: number; // 12
	minMonthWidth: number; // from config.ui.minMonthColWidth
};


