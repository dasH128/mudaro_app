// Cifras del mes de la lista de pedidos. TypeScript puro: sin React, Next ni Supabase.

import type { OrdersMetrics } from "./types";

/** Lo mínimo que se necesita de cada envío para contar. Las fechas son instantes ISO. */
export type MetricsSource = {
  status: "new" | "awaiting-inventory" | "inventory-received" | "quoted" | "won" | "lost";
  createdAt: string;
  statusChangedAt: string;
};

const DAY_MS = 86_400_000;
const WEEKS_SHOWN = 4;

/** aaaa-mm-dd de Lisboa a partir de un instante. */
function lisbonDay(instant: Date | string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date(instant));
}

/** Año y semana ISO (1-53) de un día aaaa-mm-dd. El año evita mezclar la semana 1 de dos años distintos. */
function isoWeek(day: string): { year: number; week: number } {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const year = date.getUTCFullYear();
  const week = Math.ceil(((date.getTime() - Date.UTC(year, 0, 1)) / DAY_MS + 1) / 7);
  return { year, week };
}

/** Pedidos nuevos y ganados del mes en curso, y pedidos creados por semana ISO (de la más antigua a la actual). */
export function buildOrdersMetrics(items: readonly MetricsSource[], now: Date): OrdersMetrics {
  const month = lisbonDay(now).slice(0, 7);
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, index) =>
    isoWeek(lisbonDay(new Date(now.getTime() - (WEEKS_SHOWN - 1 - index) * 7 * DAY_MS))),
  );

  return {
    newThisMonth: items.filter((item) => lisbonDay(item.createdAt).startsWith(month)).length,
    wonThisMonth: items.filter((item) => item.status === "won" && lisbonDay(item.statusChangedAt).startsWith(month)).length,
    weekly: weeks.map(({ year, week }) => ({
      week,
      count: items.filter((item) => {
        const created = isoWeek(lisbonDay(item.createdAt));
        return created.year === year && created.week === week;
      }).length,
    })),
  };
}
