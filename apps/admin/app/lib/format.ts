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

/** "01/10/2026" -> "2026-10-01". Devuelve null si el formato o la fecha no son válidos (p. ej. 31/02). */
export function parseDatePt(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  const isReal =
    date.getUTCFullYear() === Number(yyyy) &&
    date.getUTCMonth() === Number(mm) - 1 &&
    date.getUTCDate() === Number(dd);

  return isReal ? `${yyyy}-${mm}-${dd}` : null;
}

/** Fecha de hoy en Portugal como "aaaa-mm-dd". */
export function todayIso(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date());
}
