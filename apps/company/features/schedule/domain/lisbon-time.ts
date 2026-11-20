// Conversión de día y hora de Lisboa a instante (UTC), para guardar inicio y fin de un trabajo. Lógica pura.

const lisbon = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Diferencia (ms) entre la hora de Lisboa y UTC en un instante. */
function offsetAt(timestamp: number): number {
  const parts = Object.fromEntries(lisbon.formatToParts(new Date(timestamp)).map((part) => [part.type, Number(part.value)]));
  return Date.UTC(parts.year ?? 0, (parts.month ?? 1) - 1, parts.day ?? 1, parts.hour ?? 0, parts.minute ?? 0) - timestamp;
}

/**
 * "2026-12-20" y "09:30" de Lisboa → instante ISO. `null` si la fecha o la hora no son válidas o si esa hora no
 * existe en Lisboa (el salto del cambio de hora de marzo).
 */
export function lisbonInstant(date: string, time: string): string | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const clock = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!day || !clock) return null;
  const wall = Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]), Number(clock[1]), Number(clock[2]));
  // Una fecha que no existe (30/02) se desplazaría al mes siguiente
  if (new Date(wall).toISOString().slice(0, 10) !== date) return null;
  // Dos pasadas: el desfase depende del propio instante (horario de verano)
  let timestamp = wall - offsetAt(wall);
  timestamp = wall - offsetAt(timestamp);
  return timestamp + offsetAt(timestamp) === wall ? new Date(timestamp).toISOString() : null;
}
