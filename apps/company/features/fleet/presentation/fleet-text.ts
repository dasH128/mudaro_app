import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDate, formatDayMonth, formatEuro, formatInteger } from "@/app/lib/format";
import { daysSinceLastUse, nextJob, stateOf, type VehicleState } from "../domain/fleet";
import type { Vehicle, VehicleEvent } from "../domain/types";

export type FleetText = Dictionary["app"]["fleet"];

/** Motivo y "desde 20/10 · Gema" de un vehículo inactivo. */
export function describeInactive(vehicle: Vehicle, t: FleetText): { reason: string; since: string } {
  const inactive = vehicle.inactive;
  if (!inactive) return { reason: t.status.inactive, since: "" };
  return {
    reason: t.inactiveReasons[inactive.reason],
    since: interpolate(t.since, { date: formatDayMonth(inactive.since), by: inactive.by }),
  };
}

export type StatusText = { state: VehicleState; label: string; note: string };

/** Pasa el estado del vehículo a los textos: etiqueta de la insignia y la línea de detalle. */
export function describeStatus(vehicle: Vehicle, t: FleetText): StatusText {
  const state = stateOf(vehicle);
  const label = t.status[state];

  if (!vehicle.active) {
    const { reason, since } = describeInactive(vehicle, t);
    return { state, label, note: since ? `${reason} · ${since}` : t.inactiveNote };
  }
  const { live } = vehicle;
  const note =
    live.kind === "busy"
      ? interpolate(t.live.busyUntil, { time: live.until, orderId: live.orderId })
      : live.returnedAt
        ? interpolate(t.live.returned, { time: live.returnedAt })
        : t.live.noJobsToday;
  return { state, label, note };
}

export type DateText = { title: string; sub: string };

/** "Hoje · em uso agora", "22/10 · há 8 dias". */
export function describeLastUse(vehicle: Vehicle, t: FleetText, locale: Locale, today: string): DateText {
  const days = daysSinceLastUse(vehicle, today);
  if (days === 0) {
    const { live } = vehicle;
    const sub =
      live.kind === "busy"
        ? t.lastUse.inUse
        : live.returnedAt
          ? interpolate(t.lastUse.until, { time: live.returnedAt })
          : "";
    return { title: t.lastUse.today, sub };
  }
  return { title: formatDayMonth(vehicle.lastUseOn), sub: pluralize(locale, days, t.lastUse.daysAgo) };
}

/** "31/10 · 09:00" y el cliente; sin trabajos, "Sem data". */
export function describeNextUse(vehicle: Vehicle, t: FleetText, today: string): DateText {
  const job = nextJob(vehicle, today);
  if (!vehicle.active) return { title: "—", sub: "" };
  if (!job) return { title: t.nextUse.none, sub: t.nextUse.nothing };
  return { title: `${formatDayMonth(job.date)} · ${job.start}`, sub: job.client };
}

/** Título de cada entrada del histórico del vehículo. */
export function describeEvent(event: VehicleEvent, t: FleetText): { title: string; meta: string } {
  const h = t.panel.history;
  const meta = `${formatDate(event.at)} · ${event.by}`;
  switch (event.kind) {
    case "added":
      return { title: event.withoutCost ? h.addedNoCost : h.added, meta };
    case "cost-changed":
      return { title: interpolate(h.costChanged, { from: formatEuro(event.fromCents), to: formatEuro(event.toCents) }), meta };
    case "max-load-changed":
      return {
        title: interpolate(h.maxLoadChanged, { from: formatInteger(event.fromKg), to: formatInteger(event.toKg) }),
        meta,
      };
    case "deactivated":
      return { title: interpolate(h.deactivated, { reason: t.inactiveReasons[event.reason].toLowerCase() }), meta };
  }
}
