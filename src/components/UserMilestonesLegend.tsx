import type { UserMilestoneData } from './UserMilestone';

type UserMilestonesLegendProps = {
	milestones: UserMilestoneData[];
	onDelete: (id: string) => void;
};

export function UserMilestonesLegend({ milestones, onDelete }: UserMilestonesLegendProps) {
	if (milestones.length === 0) {
		return (
			<div
				style={{
					position: 'fixed',
					bottom: '24px',
					left: '24px',
					padding: '12px 16px',
					backgroundColor: 'rgba(255, 255, 255, 0.9)',
					borderRadius: '8px',
					fontSize: '11px',
					fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, monospace',
					color: 'rgba(29, 29, 29, 0.6)',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					pointerEvents: 'auto',
					zIndex: 30,
					maxWidth: '240px',
				}}
			>
				No plans added yet. Click the timeline to add one.
			</div>
		);
	}

	const sortedMilestones = [...milestones].sort((a, b) => {
		// Sort by startMonthId first, then by label
		if (a.startMonthId !== b.startMonthId) {
			return a.startMonthId.localeCompare(b.startMonthId);
		}
		return a.label.localeCompare(b.label);
	});

	return (
		<div
			style={{
				position: 'fixed',
				bottom: '24px',
				left: '24px',
				padding: '12px 16px',
				backgroundColor: 'rgba(255, 255, 255, 0.9)',
				borderRadius: '8px',
				fontSize: '11px',
				fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, monospace',
				color: '#1d1d1d',
				boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
				pointerEvents: 'auto',
				zIndex: 30,
				maxWidth: '280px',
				maxHeight: '400px',
				overflowY: 'auto',
			}}
		>
			<div style={{ marginBottom: '8px', fontWeight: 500, fontSize: '12px' }}>
				Your Plans
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
				{sortedMilestones.map((milestone) => {
					const startDate = new Date(milestone.startMonthId + '-01');
					const endDate = new Date(milestone.endMonthId + '-01');
					const startMonthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
					const endMonthName = endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
					
					// Format date range: single month or range
					const dateRange = milestone.startMonthId === milestone.endMonthId
						? startMonthName
						: `${startMonthName}–${endMonthName}`;
					
					return (
						<div
							key={milestone.id}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '4px 0',
							}}
						>
							{/* Colored dot */}
							<div
								style={{
									width: '10px',
									height: '10px',
									borderRadius: '50%',
									backgroundColor: milestone.color,
									flexShrink: 0,
								}}
							/>
							{/* Label and date range */}
							<div style={{ flex: 1, minWidth: 0 }}>
								<span style={{ fontWeight: 500 }}>{milestone.label}</span>
								<span style={{ color: 'rgba(29, 29, 29, 0.6)', marginLeft: '4px' }}>
									— {dateRange}
								</span>
							</div>
							{/* Delete button */}
							<button
								onClick={() => onDelete(milestone.id)}
								style={{
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									padding: '2px 4px',
									color: 'rgba(29, 29, 29, 0.5)',
									fontSize: '14px',
									lineHeight: 1,
									flexShrink: 0,
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = '#1d1d1d';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = 'rgba(29, 29, 29, 0.5)';
								}}
								aria-label={`Delete ${milestone.label}`}
							>
								×
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}

