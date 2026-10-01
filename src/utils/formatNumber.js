export function formatNumber(value, options = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  const { locale = 'en-US', minimumFractionDigits, maximumFractionDigits } = options;
  return new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits }).format(num);
}
