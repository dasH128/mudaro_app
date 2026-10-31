import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { DEFAULT_VIEW, showToParam, type Show, type ScheduleView } from "../domain/schedule";

export type ScheduleParams = {
  view?: ScheduleView;
  /** Día de referencia de la semana, el día o el mes. Sin él, hoy. */
  date?: string;
  show?: Show;
  /** Trabajo abierto en el panel. */
  job?: string;
  /** Día elegido en la vista de mes. */
  day?: string;
};

/** Enlace a la agenda con vista, fecha, filtro y trabajo abierto en la URL. Lo que vale lo de por defecto no se escribe. */
export function scheduleHref(lang: Locale, { view, date, show, job, day }: ScheduleParams): string {
  const params = new URLSearchParams();
  if (view && view !== DEFAULT_VIEW) params.set("view", view);
  if (date) params.set("date", date);
  const showParam = show ? showToParam(show) : undefined;
  if (showParam) params.set("show", showParam);
  if (day) params.set("day", day);
  if (job) params.set("job", job);
  const query = params.toString();
  const path = localePath(lang, ROUTES.schedule);
  return query ? `${path}?${query}` : path;
}
