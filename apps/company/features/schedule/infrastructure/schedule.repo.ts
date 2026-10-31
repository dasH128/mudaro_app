import "server-only";

import type { ScheduleOverview } from "../domain/types";
import { PEOPLE, VEHICLES, mockJobs, mockProposals } from "./mock-data";

// Única puerta de entrada a los datos de la agenda: las páginas importan de aquí.
// TODO(supabase): sustituir los datos de ejemplo por consultas (RLS por company_id, RNF-01), conservando la firma.
// Las personas y los vehículos saldrán de Equipa y Frota.

type Options = {
  /** Día de hoy en Lisboa (aaaa-mm-dd): las fechas de ejemplo se calculan desde él. */
  today: string;
};

/** Trabajos, propuestas pendientes, vehículos y personas de la empresa de la sesión. */
export async function getScheduleOverview({ today }: Options): Promise<ScheduleOverview> {
  return { vehicles: VEHICLES, people: PEOPLE, jobs: mockJobs(today), proposals: mockProposals(today) };
}
