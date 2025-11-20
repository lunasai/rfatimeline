import type { Explanation } from '../lib/explanation';

type CalculationExplanationContentProps = {
	explanation: Explanation;
};

// Simple markdown-like bold formatting helper
const formatText = (text: string) => {
	const parts: (string | React.ReactElement)[] = [];
	let lastIndex = 0;
	const regex = /\*\*(.*?)\*\*/g;
	let match;

	while ((match = regex.exec(text)) !== null) {
		// Add text before the match
		if (match.index > lastIndex) {
			parts.push(text.substring(lastIndex, match.index));
		}
		// Add the bold text
		parts.push(
			<strong key={match.index} style={{ fontWeight: 600 }}>
				{match[1]}
			</strong>
		);
		lastIndex = regex.lastIndex;
	}
	// Add remaining text
	if (lastIndex < text.length) {
		parts.push(text.substring(lastIndex));
	}

	return parts.length > 0 ? parts : [text];
};

export function CalculationExplanationContent({ explanation }: CalculationExplanationContentProps) {
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
				How this estimate is calculated
			</h1>

			{explanation.paragraphs.map((para, idx) => (
				<p
					key={idx}
					style={{
						marginTop: 0,
						marginBottom: '20px',
						whiteSpace: 'pre-line',
					}}
				>
					{formatText(para.content)}
				</p>
			))}
		</>
	);
}

