import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { interpolate } from "@/app/i18n/interpolate";
import { formatCubicMeters, formatDayMonth, formatPhone, formatWeekdayShort } from "@/app/lib/format";
import type { Person, ScheduleJob, Vehicle } from "@/features/schedule/domain/types";
import { describeAccess, type ScheduleText } from "@/features/schedule/presentation/schedule-text";

export type JobsText = Dictionary["app"]["jobs"];

/**
 * Resumen del trabajo para mandar al equipo por WhatsApp o donde la empresa quiera (plan del paso 6, 6.3).
 * Sin precios ni importes (RNF-03): fecha y horas, cliente y teléfono, moradas con accesos, volumen, vehículo y equipo.
 */
export function crewSummary(
  job: ScheduleJob,
  { vehicle, crew, lead }: { vehicle: Vehicle | undefined; crew: readonly Person[]; lead: Person | undefined },
  { t, schedule, locale }: { t: JobsText; schedule: ScheduleText; locale: Locale },
): string {
  const s = t.summary;
  const detail = job.detail;
  const lines = [
    `${job.id} · ${formatWeekdayShort(locale, job.date)} ${formatDayMonth(job.date)}, ${job.start}–${job.end}`,
    interpolate(s.client, { name: job.client, phone: detail ? formatPhone(detail.clientPhone) : "" }),
    ...(detail?.addresses ?? []).map((address) =>
      interpolate(address.kind === "origin" ? s.pickup : s.delivery, { place: address.place, access: describeAccess(address.access, schedule) }),
    ),
    interpolate(s.volume, { volume: formatCubicMeters(job.volumeM3) }),
    interpolate(s.vehicle, { vehicle: vehicle?.name ?? s.none }),
    interpolate(s.crew, {
      crew: crew.length === 0 ? s.none : crew.map((person) => (person.id === lead?.id ? interpolate(s.lead, { name: person.name }) : person.name)).join(", "),
    }),
  ];
  return lines.join("\n");
}
