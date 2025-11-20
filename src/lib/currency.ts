/**
 * Currency formatting utilities
 * Uses universal format: period (.) for thousands separator, comma (,) for decimal separator
 * Example: 20000.50 -> "20.000,50"
 */

/**
 * Formats a number as currency in universal format
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0, no decimals)
 * @returns Formatted string (e.g., "20.000,50" or "20.000")
 */
export function formatCurrency(value: number, decimals: number = 0): string {
	if (isNaN(value) || !isFinite(value)) {
		return '0';
	}

	// Round to specified decimals
	const rounded = decimals > 0 
		? Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
		: Math.round(value);

	// Split into integer and decimal parts
	const parts = rounded.toString().split('.');
	const integerPart = parts[0];
	const decimalPart = parts[1] || '';

	// Format integer part with period as thousands separator
	const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	// Format decimal part (pad with zeros if needed)
	let formattedDecimal = '';
	if (decimals > 0) {
		const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
		formattedDecimal = ',' + paddedDecimal;
	}

	return formattedInteger + formattedDecimal;
}

/**
 * Formats a number as currency with 2 decimal places
 * @param value - The number to format
 * @returns Formatted string (e.g., "20.000,50")
 */
export function formatCurrencyWithDecimals(value: number): string {
	return formatCurrency(value, 2);
}

