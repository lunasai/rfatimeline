import { config } from '../config';

type BenefitProps = {
	label: string;
	style?: React.CSSProperties;
};

export default function Benefit({ label, style }: BenefitProps) {
	return (
		<div
			className="benefit-pill"
			style={{
				position: 'absolute',
				left: '50%',
				transform: 'translateX(-50%)',
				height: 28,
				minWidth: 128,
				padding: '0 12px',
				borderRadius: 16, // Highly rounded corners (16px)
				border: '1px solid #0009FF',
				backgroundColor: 'rgba(255,255,255,0.96)',
				boxShadow: '0 3px 8px rgba(0,0,0,0.04)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: '#0009FF',
				fontFamily: config.ui.font,
				fontSize: 11,
				whiteSpace: 'nowrap',
				pointerEvents: 'none',
				...style,
			}}
			aria-hidden="true"
		>
			{label}
		</div>
	);
}


