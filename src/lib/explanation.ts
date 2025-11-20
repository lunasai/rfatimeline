import type { BenefitDetails } from './calc';
import { formatCurrency } from './currency';

export type ExplanationScenario = 
	| 'severance-only'
	| 'severance-plus-outplacement'
	| 'lapse-date'
	| 'before-outplacement';

export type ExplanationParagraph = {
	type: 'text';
	content: string;
};

export type Explanation = {
	scenario: ExplanationScenario;
	paragraphs: ExplanationParagraph[];
};

/**
 * Builds explanation text for a calculation result based on the scenario
 */
export function buildExplanationText(
	details: BenefitDetails | null,
	yearlySalary: number,
	exitDate: Date,
	showSpecialMessage: 'equal' | 'before' | null
): Explanation | null {
	if (!details) {
		return null;
	}

	// Determine scenario
	if (showSpecialMessage === 'before') {
		return {
			scenario: 'before-outplacement',
			paragraphs: [
				{
					type: 'text',
					content: "For this date, we can't reliably estimate your package. Leaving before or exactly at the start of outplacement changes how SBR is applied. Please discuss this scenario directly with HR so they can confirm what would apply to you.",
				},
			],
		};
	}

	if (showSpecialMessage === 'equal') {
		return {
			scenario: 'lapse-date',
			paragraphs: [
				{
					type: 'text',
					content: "If you leave on the day your role lapses, what you receive depends on your choice. If you **decline outplacement**, you receive severance plus an extra opt-out payment (50% of your total outplacement period in salary). If you **accept outplacement**, you receive severance only. HR can confirm the exact amounts for your situation.",
				},
			],
		};
	}

	// Calculate derived values
	const monthlySalary = yearlySalary / 12;
	const serviceYears = details.rawServiceFullYears;
	const serviceMonths = details.rawServiceRemainderMonths;
	const weightedYears = details.weightedYearsA;
	const baseSeverance = details.baseSeverance;
	const additionalComp = details.additionalComp;
	const totalPayout = details.totalPayout;
	const outplacementEntitlementMonths = details.outplacementEntitlementMonths;
	const remainingUnusedMonths = details.remainingFullOutplacementMonths;

	// Format exit month name
	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	const exitMonth = monthNames[exitDate.getMonth()];

	// Scenario: Severance only (no unused outplacement)
	if (additionalComp <= 0 || remainingUnusedMonths <= 0) {
		const serviceText = serviceMonths > 0 
			? `${serviceYears} years ${serviceMonths} months`
			: `${serviceYears} years`;
		
		return {
			scenario: 'severance-only',
			paragraphs: [
				{
					type: 'text',
					content: "Your severance is based on how long you've worked at the company up to your final workday and your age over those years.",
				},
				{
					type: 'text',
					content: `In this estimate, we used **${serviceText}** of service, which becomes **${formatCurrency(weightedYears, 1)} weighted years** under the SBR rules.`,
				},
				{
					type: 'text',
					content: `Your monthly gross salary (including 8% holiday allowance) is **€${formatCurrency(monthlySalary, 2)}**.\n\nSeverance = **${formatCurrency(weightedYears, 1)} × €${formatCurrency(monthlySalary, 2)} = €${formatCurrency(baseSeverance)}**.`,
				},
				{
					type: 'text',
					content: `The total shown here is **€${formatCurrency(totalPayout)} before tax**. Actual payment may differ slightly due to rounding, caps, and your personal tax situation.`,
				},
			],
		};
	}

	// Scenario: Severance + unused outplacement
	const serviceText = serviceMonths > 0 
		? `${serviceYears} years ${serviceMonths} months`
		: `${serviceYears} years`;
	
	return {
		scenario: 'severance-plus-outplacement',
		paragraphs: [
			{
				type: 'text',
				content: 'This estimate includes severance **plus** an extra payment for unused outplacement months.',
			},
			{
				type: 'text',
				content: `Your severance is based on **${serviceText}** of service, which equals **${formatCurrency(weightedYears, 1)} weighted years**. With a monthly gross salary of **€${formatCurrency(monthlySalary, 2)}** (including holiday allowance), this gives a severance of **€${formatCurrency(baseSeverance)}**.`,
			},
			{
				type: 'text',
				content: `You are entitled to **${outplacementEntitlementMonths} months** of outplacement. Leaving in **${exitMonth}** means you still have **${remainingUnusedMonths} full month(s)** unused.`,
			},
			{
				type: 'text',
				content: `Under SBR, you receive **50% of your monthly salary for each unused month**. That gives an extra **€${formatCurrency(additionalComp)}** in this estimate.`,
			},
			{
				type: 'text',
				content: `The total shown here is **€${formatCurrency(totalPayout)} before tax**. Actual payment may differ slightly due to rounding, caps, and your personal tax situation.`,
			},
		],
	};
}

