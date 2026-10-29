import "server-only";

import type { Dashboard } from "../domain/types";
import { ACTIVITY, JOBS, STAGES, STATS } from "./mock-data";

// Única puerta de entrada a los datos del panel: las páginas importan de aquí.
// TODO(supabase): sustituir los datos de ejemplo por consultas, conservando la firma.

/** Resumen de "Operações de hoje" de la empresa de la sesión. */
export async function getDashboard(): Promise<Dashboard> {
  return { stats: STATS, jobs: JOBS, stages: STAGES, activity: ACTIVITY };
}
