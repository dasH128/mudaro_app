import { interpolate } from "@/app/i18n/interpolate";
import { formatCompact } from "@/app/lib/format";
import type { ScheduleJob, ScheduleOverview } from "../domain/types";
import type { Option } from "./components/job-actions";
import type { PositionsText, ScheduleText } from "./schedule-text";

/**
 * Vehículos y personas que se pueden elegir para un trabajo, con su línea de detalle: ocupado en otro trabajo que se
 * solapa ("ocupado 09:00–13:00 · MD-0836") o libre. Solo lo activo se puede elegir; lo que ya está asignado sale
 * siempre, para no perderlo al guardar. Lo usan el panel de la Agenda y la ficha del trabajo.
 */
export function jobOptions(
  job: ScheduleJob,
  overview: ScheduleOverview,
  e: ScheduleText["panel"]["edit"],
  positions: PositionsText,
): { vehicles: Option[]; people: Option[] } {
  // Otro trabajo del mismo día que se solapa con este (inicio < fin del otro y fin > inicio del otro)
  const clashWith = (uses: (other: ScheduleJob) => boolean) =>
    overview.jobs.find((other) => other.id !== job.id && other.date === job.date && other.start < job.end && other.end > job.start && uses(other));
  const describe = (clash: ScheduleJob | undefined, fallback: string) =>
    clash ? interpolate(e.busyAt, { start: clash.start, end: clash.end, id: clash.id }) : fallback;

  return {
    vehicles: overview.vehicles
      .filter((v) => v.active || v.id === job.vehicleId)
      .map((v) => {
        const clash = clashWith((other) => other.vehicleId === v.id);
        return { id: v.id, name: v.name, sub: describe(clash, interpolate(e.capacity, { capacity: formatCompact(v.capacityM3) })), busy: clash !== undefined };
      }),
    people: overview.people
      .filter((person) => person.active || job.crewIds.includes(person.id))
      .map((person) => {
        const clash = clashWith((other) => other.crewIds.includes(person.id));
        return { id: person.id, name: person.name, sub: describe(clash, `${positions[person.position]} · ${e.free}`), busy: clash !== undefined };
      }),
  };
}
