import { config } from '../config';
import { getMonthIndex } from '../lib/months';

type Span =
	| { startMonth: string; endMonth: string } // inclusive bounds, e.g., Nov → Jun
	| { startIndex: number; endIndexInclusive: number };

type PeriodBubbleProps = {
	span: Span;
	variant?: 'regular' | 'outplacement';
	label?: string;
	// Optional vertical metrics
	top?: number; // px from top of central window
	height?: number; // px
};

export function PeriodBubble({
	span,
	variant = 'regular',
	label,
	top = 48,
	height = 90,
}: PeriodBubbleProps) {
	let startIndex = 0;
	let endIndexInclusive = 0;
	if ('startMonth' in span) {
		startIndex = getMonthIndex(span.startMonth);
		endIndexInclusive = getMonthIndex(span.endMonth);
	} else {
		startIndex = span.startIndex;
		endIndexInclusive = span.endIndexInclusive;
	}
	const monthsSpanned = Math.max(1, endIndexInclusive - startIndex + 1);

	// Match Figma design exactly
	const baseShadow = '0px 8px 8px 0px rgba(0, 0, 0, 0.04)';
	const outlineRegular = '1px solid rgba(0, 9, 255, 0.1)';
	const outlineOutplacement = '1px solid rgba(0, 9, 255, 0.1)';
	const fillRegular = 'rgba(255, 255, 255, 0.8)'; // Match Figma
	const fillOutplacement = 'rgba(235, 235, 255, 0.6)'; // Match Figma

	const style: React.CSSProperties = {
		position: 'absolute',
		left: `calc(var(--col-w) * ${startIndex})`,
		width: `calc(var(--col-w) * ${monthsSpanned})`,
		top,
		height,
		borderRadius: 20, // Match Figma rounded-[20px]
		boxShadow: baseShadow,
		border: variant === 'outplacement' ? outlineOutplacement : outlineRegular,
		background: variant === 'outplacement' ? fillOutplacement : fillRegular,
		pointerEvents: 'none',
	};

	return (
		<div className="period-bubble" style={style}>
			{variant === 'outplacement' && (
				<div
					className="absolute inset-0 flex items-center justify-center"
					style={{
						fontFamily: config.ui.font,
						fontSize: '16px',
						fontWeight: 400,
						color: '#0009ff',
						userSelect: 'none',
						pointerEvents: 'none',
					}}
				>
					{label ?? 'Outplacement'}
				</div>
			)}
		</div>
	);
}

export default PeriodBubble;


