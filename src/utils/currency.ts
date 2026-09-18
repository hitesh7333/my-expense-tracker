/**
 * Currency utilities storing monetary values in integer paise (minor units)
 * to avoid floating-point math issues.
 */

export function toMinorUnits(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function toMajorUnits(paise: number): number {
  if (typeof paise !== 'number' || isNaN(paise) || !isFinite(paise)) return 0;
  return paise / 100;
}

export function formatCurrency(paise: number, symbol = '₹'): string {
  if (typeof paise !== 'number' || isNaN(paise) || !isFinite(paise)) {
    return `${symbol}0.00`;
  }
  const major = toMajorUnits(paise);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(major));

  const sign = major < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

export function formatCompactCurrency(paise: number, symbol = '₹'): string {
  if (typeof paise !== 'number' || isNaN(paise) || !isFinite(paise)) {
    return `${symbol}0`;
  }
  const major = Math.abs(toMajorUnits(paise));
  const sign = paise < 0 ? '-' : '';
  if (major >= 10000000) {
    return `${sign}${symbol}${(major / 10000000).toFixed(1)}Cr`;
  } else if (major >= 100000) {
    return `${sign}${symbol}${(major / 100000).toFixed(1)}L`;
  } else if (major >= 1000) {
    return `${sign}${symbol}${(major / 1000).toFixed(1)}k`;
  }
  return `${sign}${symbol}${Math.round(major)}`;
}
