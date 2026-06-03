export function formatMMK(value: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'MMK',
		currencyDisplay: 'code',
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
	}).format(Number.isFinite(value) ? value : 0);
}
