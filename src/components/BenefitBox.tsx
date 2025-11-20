import { useMemo, useState } from 'react';
import { config } from '../config';
import { computeBenefitDetailsByDates } from '../lib/calc';
import { formatCurrency } from '../lib/currency';
import { buildExplanationText } from '../lib/explanation';
import { ReadMeModal } from './ReadMeModal';
import { CalculationExplanationContent } from './CalculationExplanationContent';

type BenefitBoxProps = {
	labels: string[];
	endMonthIndex: number; // Nov 2025 = 0 ... Nov 2026 = 12
	style?: React.CSSProperties;
};

const STORAGE_KEY = 'rfa-timeline-inputs';

export default function BenefitBox({ labels: _labels, endMonthIndex, style }: BenefitBoxProps) {
	
	// Calculate exit package estimate and details
	const calculationDetails = useMemo(() => {
		// 0) Inputs
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;
		let monthlySalary = 0; // yearly salary with holiday allowance included (stored as monthlySalary for backward compatibility)
		let startOfEmployment = '';
		let birthday = '';
		let roleLapseMonth = '';
		let roleLapseYear = '';
		try {
			const state = JSON.parse(stored);
			// Parse universal format: period for thousands, comma for decimal
			// Convert to standard format for parsing: remove periods, replace comma with period
			const salaryStr = String(state.monthlySalary ?? '')
				.replace(/\./g, '') // Remove thousands separators (periods)
				.replace(',', '.'); // Replace decimal separator (comma) with period for parseFloat
			monthlySalary = parseFloat(salaryStr) || 0;
			startOfEmployment = String(state.startOfEmployment ?? '');
			birthday = String(state.birthday ?? '');
			roleLapseMonth = String(state.roleLapseMonth ?? '');
			roleLapseYear = String(state.roleLapseYear ?? '');
		} catch {
			return null;
		}
		if (monthlySalary <= 0) return null;

		// Parse dates
		const parseStart = (s: string): Date | null => {
			const m = s.match(/^\s*(\d{2})\s*\/\s*(\d{4})\s*$/);
			if (!m) return null;
			const month = parseInt(m[1], 10);
			const year = parseInt(m[2], 10);
			if (month < 1 || month > 12) return null;
			return new Date(year, month - 1, 1);
		};

		const parseBirthday = (s: string): Date | null => {
			const m = s.match(/^\s*(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})\s*$/);
			if (!m) return null;
			const day = parseInt(m[1], 10);
			const month = parseInt(m[2], 10);
			const year = parseInt(m[3], 10);
			if (month < 1 || month > 12) return null;
			return new Date(year, month - 1, Math.min(day, 28));
		};

		const toExitDate = (idx: number): Date => {
			const baseYear = 2025;
			const baseMonth = 10; // Nov (0-based)
			const m = baseMonth + idx;
			const y = baseYear + Math.floor(m / 12);
			const mm = ((m % 12) + 12) % 12;
			return new Date(y, mm, 1);
		};

		const exitDate = toExitDate(endMonthIndex);

		// Parse role lapse date first (before early return check)
		const monthNameToNumber: Record<string, number> = {
			'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
			'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
			'Dez': 11, 'Fev': 1, 'Mei': 4,
		};
		let roleLapseDate: Date | null = new Date(2026, 6, 1);
		if (roleLapseMonth && roleLapseYear) {
			const monthNum = monthNameToNumber[roleLapseMonth];
			if (monthNum !== undefined) {
				const year = parseInt(roleLapseYear, 10);
				if (!isNaN(year)) {
					roleLapseDate = new Date(year, monthNum, 1);
				}
			}
		}

		// Compare dates by calendar date (year, month, day) ignoring time
		let showSpecialMessage: 'equal' | 'before' | null = null;
		if (roleLapseDate) {
			const exitYear = exitDate.getFullYear();
			const exitMonth = exitDate.getMonth();
			const exitDay = exitDate.getDate();
			const lapseYear = roleLapseDate.getFullYear();
			const lapseMonth = roleLapseDate.getMonth();
			const lapseDay = roleLapseDate.getDate();
			
			if (exitYear < lapseYear || 
				(exitYear === lapseYear && exitMonth < lapseMonth) ||
				(exitYear === lapseYear && exitMonth === lapseMonth && exitDay < lapseDay)) {
				showSpecialMessage = 'before';
			} else if (exitYear === lapseYear && exitMonth === lapseMonth && exitDay === lapseDay) {
				showSpecialMessage = 'equal';
			}
		}

		const startDate = parseStart(startOfEmployment);
		if (!startDate || exitDate <= startDate) return null;
		const birthDate = parseBirthday(birthday);

		// Get detailed calculation (even for special messages, we need it for the equal case)
		const details = computeBenefitDetailsByDates({
			employmentStartDate: startDate,
			birthDate,
			exitDate,
			monthlySalary,
			// Evaluate entitlement at role lapse, and start outplacement at role lapse month
			outplacementStartDate: roleLapseDate ?? undefined,
		});

		// If we have a special message, return with details (needed for equal case calculations)
		if (showSpecialMessage) {
			return { details, monthlySalary, showSpecialMessage };
		}

		return { details, monthlySalary, showSpecialMessage };
	}, [endMonthIndex]);

	const exitPackageEstimate = calculationDetails?.details?.totalPayout ?? null;
	const showSpecialMessage = calculationDetails?.showSpecialMessage ?? null;
	const calculationDetailsForEqual = calculationDetails?.details;
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Calculate exit date for explanation
	const exitDate = useMemo(() => {
		const baseYear = 2025;
		const baseMonth = 10; // Nov (0-based)
		const m = baseMonth + endMonthIndex;
		const y = baseYear + Math.floor(m / 12);
		const mm = ((m % 12) + 12) % 12;
		return new Date(y, mm, 1);
	}, [endMonthIndex]);

	// Build explanation text
	const explanation = useMemo(() => {
		if (!calculationDetails?.details) return null;
		return buildExplanationText(
			calculationDetails.details,
			calculationDetails.monthlySalary,
			exitDate,
			showSpecialMessage
		);
	}, [calculationDetails, exitDate, showSpecialMessage]);

	// Format text dynamically based on calculation results (reusing July logic for January)
	const formattedText = useMemo(() => {
		// If there's a special message, we'll show that instead
		if (showSpecialMessage) {
			return null; // Will be handled by the special message rendering
		}

		// If no calculation details (e.g., empty state with no salary), use labels as fallback
		if (!calculationDetails?.details) {
			const [first, second] = _labels;
			if (!first || !second) return first ?? 'Early leave scheme';
			
			// Extract multiplier from second label (e.g., "+0.5 × monthly salary (unused outplacement)")
			const multiplierMatch = second.match(/\+([\d.]+)\s*×/);
			if (multiplierMatch) {
				const multiplier = multiplierMatch[1].replace('.', ','); // Replace dot with comma
				return `Severance + ${multiplier} x monthly salary (unused outplacement)`;
			}
			
			// Fallback to original format if pattern doesn't match
			return `${first} + ${second}`;
		}

		// Use calculation results to generate text dynamically (works for both July and January)
		const details = calculationDetails.details;
		const remainingMonths = details.remainingFullOutplacementMonths;

		// If no remaining months, just show severance
		if (remainingMonths <= 0) {
			const cappedLabel = details.isSeveranceCapped ? ' (capped)' : '';
			return `Severance (per SBR formula)${cappedLabel}`;
		}

		// Calculate multiplier: 0.5 × remaining months
		const multiplier = (0.5 * remainingMonths).toFixed(1).replace('.', ',');
		const cappedLabel = details.isSeveranceCapped ? ' (capped)' : '';
		return `Severance${cappedLabel} + ${multiplier} x monthly salary (unused outplacement)`;
	}, [calculationDetails, showSpecialMessage, _labels]);

	return (
		<div
			style={{
				position: 'absolute',
				left: '50%',
				transform: 'translateX(-50%)',
				minWidth: 180,
				maxWidth: 300,
				width: 'fit-content',
				padding: 16,
				borderRadius: 9,
				border: `1px solid ${config.ui.colors.accent}`,
				backgroundColor: 'rgba(255,255,255,0.96)',
				color: config.ui.colors.ink,
				fontFamily: 'DM Sans, sans-serif',
				fontSize: 12,
				lineHeight: 1.3,
				textAlign: 'left',
				pointerEvents: 'auto',
				...style,
			}}
		>
			{/* Top point/handle (vertical) */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: -8,
					transform: 'translateX(-50%)',
					width: 4,
					height: 8,
					borderRadius: 2,
					backgroundColor: config.ui.colors.accent,
					opacity: 1,
				}}
			/>

			{showSpecialMessage === 'equal' ? (
				<>
					<div
						style={{
							color: config.ui.colors.accent,
							fontSize: 12,
							fontWeight: 400,
							textWrap: 'pretty',
							whiteSpace: 'normal',
							lineHeight: 1.5,
						}}
					>
						{calculationDetailsForEqual ? (() => {
							const severance = calculationDetailsForEqual.baseSeverance;
							const isCapped = calculationDetailsForEqual.isSeveranceCapped;
							const outplacementMonths = calculationDetailsForEqual.outplacementEntitlementMonths;
							// monthlySalary in calculationDetails is yearly, convert to monthly then to baseSalary
							// baseSalary = (yearlySalary / 12) / 1.08
							const yearlySalary = calculationDetails?.monthlySalary ?? 0;
							const baseSalary = (yearlySalary / 12) / 1.08;
							const optOutPayment = Math.round(0.5 * baseSalary * outplacementMonths);
							const declineTotal = severance + optOutPayment;
							const acceptTotal = severance;
							const cappedLabel = isCapped ? ' (capped)' : '';
							
							return (
								<>
									If you leave on the day your role lapses, it depends on your choice:
									<br />
									<br />
									– Decline outplacement: Severance{cappedLabel} plus opt-out payment (50% of your total outplacement period) = <span style={{ whiteSpace: 'nowrap' }}>€{formatCurrency(declineTotal)}</span>
									<br />
									<br />
									– Accept outplacement: Severance only = <span style={{ whiteSpace: 'nowrap' }}>€{formatCurrency(acceptTotal)}{cappedLabel}</span>
								</>
							);
						})() : (
							"The compensation for leaving on your role-lapse day isn't clearly defined. Please check with HR."
						)}
					</div>
					{explanation && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								setIsModalOpen(true);
							}}
							style={{
								marginTop: 8,
								background: 'none',
								border: 'none',
								padding: 0,
								fontSize: 12,
								fontWeight: 400,
								color: config.ui.colors.accent,
								cursor: 'pointer',
								textDecoration: 'underline',
								fontFamily: 'DM Sans, sans-serif',
								textAlign: 'left',
							}}
							aria-expanded={isModalOpen}
							aria-controls="explanation-modal"
						>
							Read more
						</button>
					)}
				</>
			) : showSpecialMessage === 'before' ? (
				<>
					<div
						style={{
							color: config.ui.colors.accent,
							fontSize: 12,
							fontWeight: 400,
							textWrap: 'pretty',
							whiteSpace: 'normal',
							lineHeight: 1.5,
						}}
					>
						Leaving early affects your eligibility for a redundancy package, please check with HR.
					</div>
					{explanation && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								setIsModalOpen(true);
							}}
							style={{
								marginTop: 8,
								background: 'none',
								border: 'none',
								padding: 0,
								fontSize: 12,
								fontWeight: 400,
								color: config.ui.colors.accent,
								cursor: 'pointer',
								textDecoration: 'underline',
								fontFamily: 'DM Sans, sans-serif',
								textAlign: 'left',
							}}
							aria-expanded={isModalOpen}
							aria-controls="explanation-modal"
						>
							Read more
						</button>
					)}
				</>
			) : formattedText ? (
				<>
					<div
						style={{
							color: config.ui.colors.accent,
							fontSize: 12,
							fontWeight: 500,
							textWrap: 'pretty',
							whiteSpace: 'normal',
							overflowWrap: 'anywhere',
							wordBreak: 'break-word',
						}}
						title={formattedText}
					>
						{formattedText}
					</div>

			{/* Exit package estimate (always visible, gray text) */}
			<div
				style={{
					marginTop: 8,
					fontSize: 12,
					fontWeight: 400,
					color: 'rgba(0,0,0,0.55)',
				}}
			>
					Exit package estimate:{' '}
					{exitPackageEstimate !== null ? (
						<span style={{ whiteSpace: 'nowrap' }}>€ {formatCurrency(exitPackageEstimate)}</span>
					) : '—'}
				</div>
				{/* Read more button */}
				{explanation && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							setIsModalOpen(true);
						}}
						style={{
							marginTop: 8,
							background: 'none',
							border: 'none',
							padding: 0,
							fontSize: 12,
							fontWeight: 400,
							color: config.ui.colors.accent,
							cursor: 'pointer',
							textDecoration: 'underline',
							fontFamily: 'DM Sans, sans-serif',
							textAlign: 'left',
						}}
						aria-expanded={isModalOpen}
						aria-controls="explanation-modal"
					>
						Read more
					</button>
				)}
				</>
			) : null}

			{/* Modal */}
			{explanation && (
				<ReadMeModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
				>
					<CalculationExplanationContent explanation={explanation} />
				</ReadMeModal>
			)}
		</div>
	);
}


