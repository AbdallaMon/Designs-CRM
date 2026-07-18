// Pure helper relocated verbatim from the original Lessons.jsx.

export const formatDuration = (duration) => {
  if (!duration) return "No duration set";
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};
