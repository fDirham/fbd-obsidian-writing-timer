export const getTimeDisplayString = (ms: number): string => {
	const diffSecondsTotal = Math.floor(ms / 1000);
	const diffHours = String(Math.floor(diffSecondsTotal / 3600)).padStart(
		2,
		"0"
	);
	const diffMinutes = String(
		Math.floor((diffSecondsTotal % 3600) / 60)
	).padStart(2, "0");

	return `${diffHours}:${diffMinutes}`;
};

export const getWordCount = (text: string): number => {
	const trimmed = text.trim();
	if (trimmed.length === 0) return 0;
	return trimmed.split(/\s+/).length;
};
