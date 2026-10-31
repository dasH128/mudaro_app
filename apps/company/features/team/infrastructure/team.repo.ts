import "server-only";

import type { TeamOverview } from "../domain/types";
import { mockAdmins, mockMetrics, mockPeople } from "./mock-data";

// Única puerta de entrada a los datos del equipo: las páginas importan de aquí.
// TODO(supabase): sustituir los datos de ejemplo por consultas (RLS por company_id, RNF-01), conservando la firma.

type Options = {
  /** Día de hoy en Lisboa (aaaa-mm-dd): las fechas de ejemplo se calculan desde él. */
  today: string;
  /** Provisional: simula una empresa sin equipo para ver el estado vacío. Desaparece al usar Supabase. */
  empty?: boolean;
};

/** Operarios, convites y administradores de la empresa de la sesión, y los indicadores del día. */
export async function getTeamOverview({ today, empty = false }: Options): Promise<TeamOverview> {
  // TODO(supabase): sin filas en `team`, la empresa solo tiene a su administrador
  if (empty) return { people: [], admins: mockAdmins(today).slice(0, 1), metrics: { understaffed: null } };
  return { people: mockPeople(today), admins: mockAdmins(today), metrics: mockMetrics(today) };
}
