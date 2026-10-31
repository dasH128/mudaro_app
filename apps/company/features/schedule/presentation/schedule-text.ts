import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDayMonth } from "@/app/lib/format";
import { daysBetween, type Issue } from "../domain/schedule";
import type { Access, HistoryEvent, LiveEvent, Moment, Person } from "../domain/types";

export type ScheduleText = Dictionary["app"]["schedule"];
/** Solo para los textos de las funciones (Motorista, Carregador…) de la gente, que viven en Equipa. */
export type PositionsText = Dictionary["app"]["team"]["positions"];

/** "André, Tiago e Hugo": nombres de pila unidos según el idioma. */
export function joinNames(names: readonly string[], locale: Locale): string {
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(names);
}

export const firstName = (fullName: string): string => fullName.split(" ")[0] ?? fullName;

/** "hoje", "ontem", "amanhã" o "a 06/11". */
export function describeDay(day: string, today: string, t: ScheduleText): string {
  const diff = daysBetween(today, day);
  if (diff === 0) return t.when.today;
  if (diff === 1) return t.when.tomorrow;
  if (diff === -1) return t.when.yesterday;
  return interpolate(t.when.on, { date: formatDayMonth(day) });
}

/** "2.º andar · elevador normal · à porta". */
export function describeAccess(access: Access, t: ScheduleText): string {
  const a = t.access;
  const floor =
    access.floor === "house" ? a.floor.house : access.floor === "ground" ? a.floor.ground : interpolate(a.floor.number, { count: access.floor });
  const { parking } = access;
  const where = parking.kind === "walk" ? interpolate(a.parking.walk, { meters: parking.meters }) : a.parking[parking.kind];
  return [floor, access.elevator ? a.elevator[access.elevator] : null, where].filter(Boolean).join(" · ");
}

/** Accesos difíciles (sin ascensor, licencia o caminar 30 m o más): se destacan en naranja. */
export function isHardAccess(access: Access): boolean {
  return access.elevator === "none" || access.parking.kind === "permit" || (access.parking.kind === "walk" && access.parking.meters >= 30);
}

/** "sem veículo nem equipa", "veículo pequeno, falta 1 pessoa". */
export function describeIssues(issues: readonly Issue[], t: ScheduleText, locale: Locale): string {
  return issues
    .map((issue) => {
      switch (issue.kind) {
        case "no-resources":
          return t.issues.noResources;
        case "no-vehicle":
          return t.issues.noVehicle;
        case "small-vehicle":
          return t.issues.smallVehicle;
        case "short-crew":
          return pluralize(locale, issue.count, t.issues.shortCrew);
      }
    })
    .join(", ");
}

/** "27/10 · Gema", "hoje · 11:15 · André". */
export function describeMoment(at: Moment, by: string | undefined, today: string, t: ScheduleText): string {
  const diff = daysBetween(today, at.date);
  const day = diff === 0 ? t.when.today : diff === -1 ? t.when.yesterday : formatDayMonth(at.date);
  return [day, at.time, by].filter(Boolean).join(" · ");
}

type Ctx = { t: ScheduleText; locale: Locale; today: string; people: readonly Person[] };

/** Título y detalle de cada entrada del histórico del trabajo. */
export function describeHistory(event: HistoryEvent, { t, locale, today, people }: Ctx): { title: string; meta: string } {
  const titles = t.panel.history.events;
  const by = "by" in event ? event.by : undefined;
  const meta = describeMoment(event.at, by, today, t);
  if (event.kind === "crew-named") {
    const names = event.personIds.map((id) => firstName(people.find((p) => p.id === id)?.name ?? id));
    return { title: interpolate(titles["crew-named"], { names: joinNames(names, locale) }), meta };
  }
  return { title: titles[event.kind], meta };
}

/** Hito de un trabajo en curso: hora, título y línea de detalle. */
export function describeLive(
  event: LiveEvent,
  { t, locale, vehicle, crew }: { t: ScheduleText; locale: Locale; vehicle: string; crew: readonly string[] },
): { time: string; label: string; sub: string } {
  const live = t.panel.live;
  let sub = "";
  if (event.kind === "incident") sub = event.note ?? "";
  else if (event.kind === "pickup-signed") sub = live.signedByClient;
  else if (event.kind === "unloading" && event.endsAt) sub = interpolate(live.endsAt, { time: event.endsAt });
  else if (event.kind === "loading" && event.photos !== undefined) sub = pluralize(locale, event.photos, live.photosSoFar);
  else if ((event.kind === "left-base" || event.kind === "arrived-origin") && event.withCrew) {
    sub = interpolate(live.vehicleCrew, { vehicle, names: joinNames(crew, locale) });
  } else if (event.kind === "arrived-origin" && event.photos !== undefined) sub = pluralize(locale, event.photos, live.photosPickup);
  return { time: event.at === "now" ? live.now : event.at, label: live.events[event.kind], sub };
}
