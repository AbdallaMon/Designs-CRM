export function toArabicNumerals(number) {
  if (!number) return number;
  return number.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${toArabicNumerals(mins)}:${toArabicNumerals(
    secs.toString().padStart(2, "0")
  )}`;
}
