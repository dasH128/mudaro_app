import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatCubicMeters } from "@/app/lib/format";
import type { ActivityItem, Job } from "../domain/types";

export type HomeText = Dictionary["app"]["home"];

/** "Mudança integral, T3", "Transferência de escritório". */
export function describeJobKind(job: Job, t: HomeText): string {
  return interpolate(t.jobs.kinds[job.kind], { typology: job.typology ?? "" });
}

/** "64 m³ · 2 viagens". */
export function describeVolume(job: Job, t: HomeText, locale: Locale): string {
  return interpolate(t.jobs.volume, { volume: formatCubicMeters(job.volumeM3), trips: pluralize(locale, job.trips, t.jobs.trips) });
}

/** "4 operários" o "Sem equipa". */
export function describeCrew(crewCount: number, t: HomeText, locale: Locale): string {
  return crewCount === 0 ? t.jobs.noCrew : pluralize(locale, crewCount, t.jobs.crew);
}

/** Etiqueta del estado; un trabajo en curso dice en qué punto va ("Em descarga"). */
export function describeJobStatus(job: Job, t: HomeText): string {
  return job.phase ? t.jobs.phase[job.phase] : t.jobs.status[job.status];
}

/** Línea de detalle de un evento de la actividad reciente. */
export function describeActivityDetail(item: ActivityItem, t: HomeText, locale: Locale): string {
  const { detail } = item;
  switch (detail.kind) {
    case "place":
      return detail.place;
    case "crew":
      return interpolate(t.activity.crew, { vehicle: detail.vehicle, crew: describeCrew(detail.crewCount, t, locale) });
    case "signed":
      return t.activity.signed;
    case "text":
      return detail.text;
  }
}
