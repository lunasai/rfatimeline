import { useState, useEffect } from 'react';
import { config } from '../config';
import { monthNameYearToMonthId, recomputeScheme } from '../lib/months';

type InputPanelState = {
	startOfEmployment: string; // MM / YYYY
	birthday: string; // DD / MM / YYYY
	monthlySalary: string; // numeric with decimals and thousands
	roleLapseMonth: string; // month name
	roleLapseYear: string; // year
	outplacementMonths: number; // 1-6
	severanceMonthsPerYear: number; // decimal, default 0.5
};

const STORAGE_KEY = 'rfa-timeline-inputs';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHOW_ADVANCED = false;

function formatNumberWithThousands(value: string): string {
	// Remove all non-digit characters except decimal point
	const cleaned = value.replace(/[^\d.]/g, '');
	// Split by decimal point
	const parts = cleaned.split('.');
	// Format integer part with thousands separator
	const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	// Rejoin with decimal part if exists
	return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
}

// Auto-size utility function
function autosizeInput(el: HTMLInputElement) {
	const s = document.createElement('span');
	s.style.visibility = 'hidden';
	s.style.position = 'fixed';
	s.style.whiteSpace = 'pre';
	s.style.font = getComputedStyle(el).font;
	s.textContent = el.value || el.placeholder || '';
	document.body.appendChild(s);
	el.style.width = `${s.offsetWidth + 4}px`;
	s.remove();
}

export default function InputPanel() {
	const [state, setState] = useState<InputPanelState>(() => {
		// Load from localStorage or use defaults
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				return JSON.parse(stored);
			} catch {
				// Fall through to defaults
			}
		}
		return {
			startOfEmployment: '',
			birthday: '',
			monthlySalary: '',
			roleLapseMonth: 'Jul',
			roleLapseYear: '2026',
			outplacementMonths: 1,
			severanceMonthsPerYear: 0.5,
		};
	});

	// Persist to localStorage on change, along with derived scheme
	useEffect(() => {
		const roleLapseId = monthNameYearToMonthId(state.roleLapseMonth, state.roleLapseYear);
		let scheme: any = null;
		if (roleLapseId) {
			scheme = recomputeScheme({
				birthday: state.birthday ?? '',
				startEmployment: state.startOfEmployment ?? '',
				roleLapse: roleLapseId,
			});
		}
		const payload = scheme ? { ...state, scheme } : { ...state };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		// Notify other parts of the app so they can recompute without a full refresh
		window.dispatchEvent(new CustomEvent('rfa-inputs-changed'));
	}, [state]);

	// Auto-size inputs on mount and when values change
	useEffect(() => {
		// Use requestAnimationFrame to ensure DOM is updated
		requestAnimationFrame(() => {
			const inputs = document.querySelectorAll<HTMLInputElement>('.auto-size');
			inputs.forEach(i => autosizeInput(i));
		});
	}, [state]);

	// Set up event listeners once on mount
	useEffect(() => {
		const inputs = document.querySelectorAll<HTMLInputElement>('.auto-size');
		const handlers = new Map<HTMLInputElement, () => void>();
		
		inputs.forEach(i => {
			const handler = () => autosizeInput(i);
			handlers.set(i, handler);
			i.addEventListener('input', handler);
			i.addEventListener('change', handler);
		});

		return () => {
			inputs.forEach(i => {
				const handler = handlers.get(i);
				if (handler) {
					i.removeEventListener('input', handler);
					i.removeEventListener('change', handler);
				}
			});
		};
	}, []); // Only run once on mount

	const updateField = <K extends keyof InputPanelState>(field: K, value: InputPanelState[K]) => {
		setState(prev => ({ ...prev, [field]: value }));
	};

	// Date mask handlers
	const handleEmploymentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
		if (value.length > 2) {
			value = value.slice(0, 2) + ' / ' + value.slice(2, 6);
		} else if (value.length > 0) {
			value = value.slice(0, 2);
		}
		updateField('startOfEmployment', value);
	};

	const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
		if (value.length > 4) {
			value = value.slice(0, 2) + ' / ' + value.slice(2, 4) + ' / ' + value.slice(4, 8);
		} else if (value.length > 2) {
			value = value.slice(0, 2) + ' / ' + value.slice(2, 4);
		} else if (value.length > 0) {
			value = value.slice(0, 2);
		}
		updateField('birthday', value);
	};

	const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatNumberWithThousands(e.target.value);
		updateField('monthlySalary', formatted);
	};

	const handleOutplacementChange = (delta: number) => {
		const newValue = Math.max(1, Math.min(6, state.outplacementMonths + delta));
		updateField('outplacementMonths', newValue);
	};

	const handleSeveranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/[^\d.]/g, '');
		const numValue = parseFloat(value) || 0;
		updateField('severanceMonthsPerYear', numValue);
	};

	const baseInputStyle = {
		fontSize: '12px',
		letterSpacing: '-0.48px',
		color: '#ffffff',
		fontWeight: 500,
		fontFamily: config.ui.font,
	} as React.CSSProperties;

	return (
		<>
			<style>{`
				.panel * { box-sizing: border-box; }
				.panel .row, .panel .row * { max-width: none; }
				.input-panel-input::placeholder {
					color: rgba(255, 255, 255, 0.4);
				}
			`}</style>
			<div
				className="fixed top-0 left-0 z-30 p-4 pointer-events-none panel"
				style={{
					fontFamily: config.ui.font,
				}}
			>
				<div className="inline-flex flex-col items-start pointer-events-auto" style={{ gap: '4px' }}>
					{/* Start of employment */}
					<div className="inline-flex items-center gap-4 px-4 py-2 rounded bg-[#1b1b1b] text-mono whitespace-nowrap w-fit self-start row">
						<label className="inline-block select-none" style={{ ...baseInputStyle, color: 'rgba(255, 255, 255, 0.7)' }}>
							start of employment:
						</label>
						<input
							type="text"
							value={state.startOfEmployment}
							onChange={handleEmploymentDateChange}
							placeholder="MM / YYYY"
							className="auto-size bg-transparent border-none outline-none input-panel-input inline-block w-auto min-w-0 basis-auto grow-0 leading-normal align-middle"
							style={{ ...baseInputStyle, width: 'auto' }}
							onFocus={(e) => {
								e.target.style.outline = '2px solid rgba(0, 9, 255, 0.5)';
								e.target.style.outlineOffset = '2px';
								e.target.style.borderRadius = '2px';
							}}
							onBlur={(e) => {
								e.target.style.outline = 'none';
							}}
						/>
					</div>

					{/* Birthday */}
					<div className="inline-flex items-center gap-4 px-4 py-2 rounded bg-[#1b1b1b] text-mono whitespace-nowrap w-fit self-start row">
						<label className="inline-block select-none" style={{ ...baseInputStyle, color: 'rgba(255, 255, 255, 0.7)' }}>
							birthday:
						</label>
						<input
							type="text"
							value={state.birthday}
							onChange={handleBirthdayChange}
							placeholder="DD / MM / YYYY"
							className="auto-size bg-transparent border-none outline-none input-panel-input inline-block w-auto min-w-0 basis-auto grow-0 leading-normal align-middle"
							style={{ ...baseInputStyle, width: 'auto' }}
							onFocus={(e) => {
								e.target.style.outline = '2px solid rgba(0, 9, 255, 0.5)';
								e.target.style.outlineOffset = '2px';
								e.target.style.borderRadius = '2px';
							}}
							onBlur={(e) => {
								e.target.style.outline = 'none';
							}}
						/>
					</div>

					{/* Yearly salary */}
					<div className="inline-flex items-center gap-4 px-4 py-2 rounded bg-[#1b1b1b] text-mono whitespace-nowrap w-fit self-start row">
						<label className="inline-block select-none" style={{ ...baseInputStyle, color: 'rgba(255, 255, 255, 0.7)' }}>
							yearly salary (€):
						</label>
						<input
							type="text"
							value={state.monthlySalary}
							onChange={handleSalaryChange}
							placeholder="0"
							className="auto-size bg-transparent border-none outline-none input-panel-input inline-block w-auto min-w-0 basis-auto grow-0 leading-normal align-middle"
							style={{ ...baseInputStyle, width: 'auto' }}
							onFocus={(e) => {
								e.target.style.outline = '2px solid rgba(0, 9, 255, 0.5)';
								e.target.style.outlineOffset = '2px';
								e.target.style.borderRadius = '2px';
							}}
							onBlur={(e) => {
								e.target.style.outline = 'none';
							}}
						/>
					</div>

					{/* Role lapse (always visible) */}
					<div className="inline-flex items-center gap-4 px-4 py-2 rounded bg-[#1b1b1b] text-mono whitespace-nowrap w-fit self-start row">
						<label className="inline-block select-none" style={{ ...baseInputStyle, color: 'rgba(255, 255, 255, 0.7)' }}>
							role lapse:
						</label>
						<select
							value={`${state.roleLapseYear}-${state.roleLapseMonth}`}
							onChange={(e) => {
								const v = e.target.value; // "2026-Jul" | "2027-Jan"
								const [year, monKey] = v.split('-');
								updateField('roleLapseYear', year as any);
								updateField('roleLapseMonth', monKey as any);
							}}
							className="bg-transparent border-none outline-none inline-block w-auto min-w-0 basis-auto grow-0 leading-normal align-middle"
							style={{ ...baseInputStyle, cursor: 'pointer' }}
							onFocus={(e) => {
								(e.target as HTMLSelectElement).style.outline = '2px solid rgba(0, 9, 255, 0.5)';
								(e.target as HTMLSelectElement).style.outlineOffset = '2px';
								(e.target as HTMLSelectElement).style.borderRadius = '2px';
							}}
							onBlur={(e) => {
								(e.target as HTMLSelectElement).style.outline = 'none';
							}}
						>
							<option value="2026-Jul" style={{ backgroundColor: '#1b1b1b', color: '#ffffff' }}>
								July 2026
							</option>
							<option value="2027-Jan" style={{ backgroundColor: '#1b1b1b', color: '#ffffff' }}>
								January 2027
							</option>
						</select>
					</div>

					{SHOW_ADVANCED && (
						<div className="inline-flex items-center gap-4 px-4 py-2 rounded bg-[#1b1b1b] text-mono whitespace-nowrap w-fit self-start row">
							<label className="inline-block select-none" style={{ ...baseInputStyle, color: 'rgba(255, 255, 255, 0.7)' }}>
								role lapse:
							</label>
							<select
								value={state.roleLapseMonth}
								onChange={(e) => updateField('roleLapseMonth', e.target.value)}
								className="bg-transparent border-none outline-none inline-block w-auto min-w-0 basis-auto grow-0 leading-normal align-middle"
								style={{ ...baseInputStyle, cursor: 'pointer' }}
								onFocus={(e) => {
									e.target.style.outline = '2px solid rgba(0, 9, 255, 0.5)';
									e.target.style.outlineOffset = '2px';
									e.target.style.borderRadius = '2px';
								}}
								onBlur={(e) => {
									e.target.style.outline = 'none';
								}}
							>
								{MONTHS.map(month => (
									<option key={month} value={month} style={{ backgroundColor: '#1b1b1b', color: '#ffffff' }}>
										{month}
									</option>
								))}
							</select>
							<input
								type="text"
								value={state.roleLapseYear}
								onChange={(e) => {
									const value = e.target.value.replace(/\D/g, '').slice(0, 4);
									updateField('roleLapseYear', value);
								}}
								placeholder="YYYY"
								className="auto-size bg-transparent border-none outline-none input-panel-input inline-block w-auto min-w-0 basis-auto grow-0 leading-normal align-middle"
								style={{ ...baseInputStyle, width: 'auto' }}
								onFocus={(e) => {
									e.target.style.outline = '2px solid rgba(0, 9, 255, 0.5)';
									e.target.style.outlineOffset = '2px';
									e.target.style.borderRadius = '2px';
								}}
								onBlur={(e) => {
									e.target.style.outline = 'none';
								}}
							/>
						</div>
					)}

					{SHOW_ADVANCED && (
						<div className="inline-flex items-center gap-4 px-4 py-2 rounded bg-[#1b1b1b] text-mono whitespace-nowrap w-fit self-start row">
							<label className="inline-block select-none" style={{ ...baseInputStyle, color: 'rgba(255, 255, 255, 0.7)' }}>
								outplacement months:
							</label>
							<button
								type="button"
								onClick={() => handleOutplacementChange(-1)}
								disabled={state.outplacementMonths <= 1}
								className="bg-transparent border-none cursor-pointer disabled:opacity-50 inline-block w-auto min-w-0 basis-auto grow-0 leading-normal align-middle"
								style={{ ...baseInputStyle, fontSize: '16px', padding: '0 4px' }}
								aria-label="Decrease"
							>
								−
							</button>
							<span className="inline-block w-[2ch] text-center" style={baseInputStyle}>
								{state.outplacementMonths}
							</span>
							<button
								type="button"
								onClick={() => handleOutplacementChange(1)}
								disabled={state.outplacementMonths >= 6}
								className="bg-transparent border-none cursor-pointer disabled:opacity-50 inline-block w-auto min-w-0 basis-auto grow-0 leading-normal align-middle"
								style={{ ...baseInputStyle, fontSize: '16px', padding: '0 4px' }}
								aria-label="Increase"
							>
								+
							</button>
						</div>
					)}

					{SHOW_ADVANCED && (
						<div className="inline-flex items-center gap-4 px-4 py-2 rounded bg-[#1b1b1b] text-mono whitespace-nowrap w-fit self-start row">
							<label className="inline-block select-none" style={{ ...baseInputStyle, color: 'rgba(255, 255, 255, 0.7)' }}>
								severance months per year:
							</label>
							<input
								type="text"
								value={String(state.severanceMonthsPerYear)}
								onChange={handleSeveranceChange}
								placeholder="0.5"
								className="auto-size bg-transparent border-none outline-none input-panel-input inline-block w-auto min-w-0 basis-auto grow-0 leading-normal align-middle"
								style={{ ...baseInputStyle, width: 'auto' }}
								onFocus={(e) => {
									e.target.style.outline = '2px solid rgba(0, 9, 255, 0.5)';
									e.target.style.outlineOffset = '2px';
									e.target.style.borderRadius = '2px';
								}}
								onBlur={(e) => {
									e.target.style.outline = 'none';
								}}
							/>
						</div>
					)}

					{/* Caption */}
					<div
						style={{
							color: 'rgba(255, 255, 255, 0.5)',
							fontSize: '10px',
							letterSpacing: '-0.4px',
							textAlign: 'left',
						}}
					>
						Inputs only — totals come next.
					</div>
				</div>
			</div>
		</>
	);
}
