const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10-01" -> "01/10/2026" */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}
