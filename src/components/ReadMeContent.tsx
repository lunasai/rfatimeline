export function ReadMeContent() {
	return (
		<>
			<h1
				style={{
					fontSize: '22px',
					fontWeight: 500,
					marginTop: 0,
					marginBottom: '24px',
					lineHeight: 1.4,
					color: '#1d1d1d',
				}}
			>
				About This Calculator
			</h1>

			<p style={{ marginTop: 0, marginBottom: '20px' }}>
				This tool was created independently to help colleagues understand their possible exit package. It is not an official company calculator, and the final outcome always depends on your personal situation and the agreement you sign. Please use this as a guide, not a promise.
			</p>

			<h2
				style={{
					fontSize: '18px',
					fontWeight: 500,
					marginTop: '32px',
					marginBottom: '16px',
					lineHeight: 1.4,
					color: '#1d1d1d',
				}}
			>
				How it works (in simple terms)
			</h2>

			<h3
				style={{
					fontSize: '16px',
					fontWeight: 500,
					marginTop: '24px',
					marginBottom: '12px',
					lineHeight: 1.4,
					color: '#1d1d1d',
				}}
			>
				1. Your severance
			</h3>

			<p style={{ marginTop: 0, marginBottom: '20px' }}>
				It's your total years of service, adjusted by an age-based weight (0.5, 1, 1.5 or 2), multiplied by your monthly salary. The tool calculates this automatically.
			</p>

			<h3
				style={{
					fontSize: '16px',
					fontWeight: 500,
					marginTop: '24px',
					marginBottom: '12px',
					lineHeight: 1.4,
					color: '#1d1d1d',
				}}
			>
				2. Outplacement
			</h3>

			<p style={{ marginTop: 0, marginBottom: '16px' }}>
				Outplacement means you stay employed for a set number of months while you fully focus on finding a new job. Most colleagues receive 4 months; some receive 6 months, depending on age or long service.
			</p>

			<p style={{ marginTop: 0, marginBottom: '20px' }}>
				During outplacement, your salary and most benefits continue. If you find a new job and leave early, you may receive a payment for the unused months. The calculator shows this automatically based on your selected end date.
			</p>

			<h3
				style={{
					fontSize: '16px',
					fontWeight: 500,
					marginTop: '24px',
					marginBottom: '12px',
					lineHeight: 1.4,
					color: '#1d1d1d',
				}}
			>
				3. Leaving earlier than planned
			</h3>

			<p style={{ marginTop: 0, marginBottom: '16px' }}>
				If you leave before outplacement begins, or on the exact day your role lapses, the rules work differently.
			</p>

			<p style={{ marginTop: 0, marginBottom: '20px' }}>
				In these situations, your compensation depends on whether you accept or decline outplacement, so it's best to confirm your specific case with HR.
			</p>

			<h2
				style={{
					fontSize: '18px',
					fontWeight: 500,
					marginTop: '32px',
					marginBottom: '16px',
					lineHeight: 1.4,
					color: '#1d1d1d',
				}}
			>
				Other things that may still apply to you
			</h2>

			<p style={{ marginTop: 0, marginBottom: '16px' }}>
				These items aren't included in the calculator, but they can affect your final settlement:
			</p>

			<ul style={{ marginTop: 0, marginBottom: '20px', paddingLeft: 0, listStyle: 'none' }}>
				<li style={{ marginBottom: '8px' }}>
					→ Holiday allowance is already included in the salary number used here
				</li>
				<li style={{ marginBottom: '8px' }}>
					→ Accrued leave hours are paid out separately
				</li>
				<li style={{ marginBottom: '8px' }}>
					→ Flexible budget continues, except extra leave hours stop accruing after redundancy
				</li>
				<li style={{ marginBottom: '8px' }}>
					→ Pension accrual, laptop, phone continue during outplacement
				</li>
				<li style={{ marginBottom: '8px' }}>
					→ Long-term incentive plans follow your official end date
				</li>
				<li style={{ marginBottom: '8px' }}>
					→ Unemployment benefits are decided by the government office
				</li>
				<li style={{ marginBottom: '8px' }}>
					→ If you are offered a permanent internal role up to two grades lower and choose not to accept it, your exit package may stop
				</li>
			</ul>

			<h2
				style={{
					fontSize: '18px',
					fontWeight: 500,
					marginTop: '32px',
					marginBottom: '16px',
					lineHeight: 1.4,
					color: '#1d1d1d',
				}}
			>
				Documents used for this tool
			</h2>

			<p style={{ marginTop: 0, marginBottom: '16px' }}>
				This tool is based on the official documents shared with employees. You can read them here:
			</p>

			<div style={{ marginTop: 0, marginBottom: '20px' }}>
				{/* Document 1 */}
				<a
					href="https://heiway.sharepoint.com/sites/HEA-por-DT/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FHEA%2Dpor%2DDT%2FShared%20Documents%2FHead%20Office%2FSBR%202024%2D2026%20ENG%2Epdf&parent=%2Fsites%2FHEA%2Dpor%2DDT%2FShared%20Documents%2FHead%20Office"
					target="_blank"
					rel="noopener noreferrer"
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '10px',
						marginBottom: '12px',
						color: '#0009FF',
						textDecoration: 'none',
						transition: 'opacity 0.2s',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.opacity = '0.7';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.opacity = '1';
					}}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						style={{ flexShrink: 0 }}
					>
						<path
							d="M4 2C3.44772 2 3 2.44772 3 3V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V5.5L9.5 2H4Z"
							stroke="currentColor"
							strokeWidth="1.2"
							fill="none"
						/>
						<path
							d="M9 2V5.5H12.5"
							stroke="currentColor"
							strokeWidth="1.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<span>1. Social Benefits & Redundancy (SBR) 2024–2026</span>
				</a>

				{/* Document 2 */}
				<a
					href="https://heiway.sharepoint.com/sites/HEA-por-DT/SiteAssets/SitePages/Head-Office-FAQ/RFA-Digital-Commerce-4-November-2025.pdf"
					target="_blank"
					rel="noopener noreferrer"
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '10px',
						marginBottom: '12px',
						color: '#0009FF',
						textDecoration: 'none',
						transition: 'opacity 0.2s',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.opacity = '0.7';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.opacity = '1';
					}}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						style={{ flexShrink: 0 }}
					>
						<path
							d="M4 2C3.44772 2 3 2.44772 3 3V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V5.5L9.5 2H4Z"
							stroke="currentColor"
							strokeWidth="1.2"
							fill="none"
						/>
						<path
							d="M9 2V5.5H12.5"
							stroke="currentColor"
							strokeWidth="1.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<span>2. Digital Commerce RFA (4 November 2025)</span>
				</a>

				{/* Document 3 */}
				<a
					href="https://heiway.sharepoint.com/sites/HEA-por-DT/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FHEA%2Dpor%2DDT%2FShared%20Documents%2FHead%20Office%2FSBR%20FAQ%20ARCHIVE%2FFrequently%20Asked%20Questions%20SBR%208%20Nov%2Epdf&parent=%2Fsites%2FHEA%2Dpor%2DDT%2FShared%20Documents%2FHead%20Office%2FSBR%20FAQ%20ARCHIVE"
					target="_blank"
					rel="noopener noreferrer"
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '10px',
						marginBottom: '12px',
						color: '#0009FF',
						textDecoration: 'none',
						transition: 'opacity 0.2s',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.opacity = '0.7';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.opacity = '1';
					}}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						style={{ flexShrink: 0 }}
					>
						<path
							d="M4 2C3.44772 2 3 2.44772 3 3V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V5.5L9.5 2H4Z"
							stroke="currentColor"
							strokeWidth="1.2"
							fill="none"
						/>
						<path
							d="M9 2V5.5H12.5"
							stroke="currentColor"
							strokeWidth="1.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<span>3. SBR FAQ (8 November)</span>
				</a>
			</div>

			{/* Gentle reminder callout */}
			<div
				style={{
					marginTop: '32px',
					marginBottom: 0,
					padding: '20px',
					backgroundColor: 'rgba(222, 222, 255, 0.3)',
					borderRadius: '8px',
					border: '1px solid rgba(222, 222, 255, 0.5)',
				}}
			>
				<h3
					style={{
						fontSize: '16px',
						fontWeight: 500,
						marginTop: 0,
						marginBottom: '12px',
						lineHeight: 1.4,
						color: '#1d1d1d',
					}}
				>
					💖 Gentle reminder
				</h3>

				<p style={{ marginTop: 0, marginBottom: '12px', lineHeight: 1.6 }}>
					I've created this tool to bring a bit more clarity on this process, and to help you plan the coming months.
				</p>

				<p style={{ marginTop: 0, marginBottom: '12px', lineHeight: 1.6 }}>
					If anything here feels unclear, please reach out to HR so they can confirm your situation.
				</p>

				<p style={{ marginTop: 0, marginBottom: '8px', lineHeight: 1.6 }}>
					You are not alone in this, you are doing your best. This process sucks, but we'll make the best out of it {'<3'}
				</p>

				<p style={{ marginTop: 0, marginBottom: 0, lineHeight: 1.6, fontWeight: 500 }}>
					Luna
				</p>
			</div>
		</>
	);
}

