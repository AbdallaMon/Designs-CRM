export function formatNumber(number) {
  if (!number) return number;
  return String(number);
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${formatNumber(mins)}:${formatNumber(
    secs.toString().padStart(2, "0")
  )}`;
}
