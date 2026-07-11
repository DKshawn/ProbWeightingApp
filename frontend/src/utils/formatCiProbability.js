function trimTrailingZeros(value) {
  return value
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

export function formatCiProbability(probability) {
  const percent = Number(probability) * 100;
  if (!Number.isFinite(percent)) return "—";
  if (percent === 0) return "0%";

  const decimals = percent < 0.01
    ? Math.max(4, Math.ceil(-Math.log10(percent)) + 1)
    : percent < 1
    ? 2
    : 1;
  return `${trimTrailingZeros(percent.toFixed(decimals))}%`;
}
