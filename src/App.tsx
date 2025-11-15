import { TimelineLayoutProvider } from './context/TimelineLayoutContext';
import TimelineShell from './components/TimelineShell';
import MonthColumns from './components/MonthColumns';

export default function App() {
	return (
		<TimelineLayoutProvider>
			<TimelineShell>
				<MonthColumns />
			</TimelineShell>
		</TimelineLayoutProvider>
	);
}
