type MonthLabelProps = {
	label: string;
	isFocused?: boolean;
	compact?: boolean;
};

export function MonthLabel({ label, compact }: MonthLabelProps) {
	return (
		<div
			className={[
				'px-2 text-center font-light',
				compact ? 'text-[10px]' : 'text-sm',
				'whitespace-nowrap overflow-hidden text-ellipsis',
				'text-ink/60',
			].join(' ')}
			aria-hidden="true"
		>
			{label}
		</div>
	);
}

export default MonthLabel;


