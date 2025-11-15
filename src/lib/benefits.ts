// Explicit month-index mapping for Nov 2025 → Nov 2026 (indices 0..12)
// Index 0 = Nov 2025, 11 = Oct 2026, 12 = Nov 2026
const benefitsByIndex: string[][] = [
	['Early leave scheme'], // Nov 2025
	['Early leave scheme'], // Dec 2025
	['Early leave scheme'], // Jan 2026
	['Early leave scheme'], // Feb 2026
	['Early leave scheme'], // Mar 2026
	['Early leave scheme'], // Apr 2026
	['Early leave scheme'], // May 2026
	['Early leave scheme'], // Jun 2026
	['Severance (per SBR formula)', '+2.0 × monthly salary (unused outplacement)'], // Jul 2026
	['Severance (per SBR formula)', '+1.5 × monthly salary (unused outplacement)'], // Aug 2026
	['Severance (per SBR formula)', '+1.0 × monthly salary (unused outplacement)'], // Sep 2026
	['Severance (per SBR formula)', '+0.5 × monthly salary (unused outplacement)'], // Oct 2026
	['Severance (per SBR formula)'], // Nov 2026
];

export function getBenefitsForIndex(index: number): string[] {
	const list = benefitsByIndex[index];
	return (list ?? ['Early leave scheme']).slice(0, 4);
}

// Extract multiplier from benefit string (e.g., "+0.5 × monthly salary" -> 0.5)
export function getOutplacementMultiplier(labels: string[]): number | null {
	const secondLabel = labels[1];
	if (!secondLabel) return null;
	
	// Match pattern like "+0.5 ×" or "+2.0 ×"
	const match = secondLabel.match(/\+([\d.]+)\s*×/);
	if (match) {
		return parseFloat(match[1]);
	}
	return null;
}


