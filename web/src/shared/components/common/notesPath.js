export function getNotesPath(slug) {
  if (slug === "shared") return "notes";
  if (slug === "accountant" || slug === "accounting") return "accounting/notes";
  return `${slug}/notes`;
}
