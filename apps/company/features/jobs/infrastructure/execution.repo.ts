import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import type { Handover, HandoverMoment, Incident, IncidentType, JobExecution, Photo } from "../domain/execution";

// Ejecución del trabajo (paso 6.5): lee actas, fotos e incidencias (RLS: solo administradores de la empresa) y
// escribe con las funciones de la base. Los ficheros van al bucket privado job-evidence, ruta
// <company_id>/<job_id>/<archivo>, y se muestran con enlaces firmados de 10 minutos (RNF-05).

const BUCKET = "job-evidence";
const SIGNED_URL_SECONDS = 600;

/** Actas, fotos e incidencias de un trabajo, con los enlaces firmados de sus ficheros. */
export async function getJobExecution(jobId: string): Promise<JobExecution> {
  const supabase = await createSupabaseServerClient();
  const [handovers, evidence, incidents] = await Promise.all([
    supabase.from("handover_records").select("id, moment, signer_name, signed_at, remarks, document_path, source").eq("job_id", jobId),
    supabase.from("evidence").select("id, moment, incident_id, file_path, taken_at, source").eq("job_id", jobId).order("taken_at"),
    supabase
      .from("incidents")
      .select("id, type, description, extra_amount_cents, occurred_at, status, resolution_note, resolved_at, source")
      .eq("job_id", jobId)
      .order("occurred_at"),
  ]);
  if (handovers.error || evidence.error || incidents.error) {
    throw new Error(`jobs: no se pudo leer la ejecución (${handovers.error?.code ?? evidence.error?.code ?? incidents.error?.code})`);
  }

  // Un solo pedido de enlaces firmados para todos los ficheros
  const paths = [
    ...evidence.data.map((row) => row.file_path),
    ...handovers.data.flatMap((row) => (row.document_path ? [row.document_path] : [])),
  ];
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }

  const photos: Photo[] = evidence.data.map((row) => ({
    id: row.id,
    moment: row.moment,
    incidentId: row.incident_id,
    takenAt: row.taken_at,
    url: urls.get(row.file_path) ?? null,
    source: row.source,
  }));

  const handoverOf = (moment: HandoverMoment): Handover | null => {
    const row = handovers.data.find((item) => item.moment === moment);
    return row
      ? {
          id: row.id,
          moment,
          signerName: row.signer_name,
          signedAt: row.signed_at,
          remarks: row.remarks,
          documentUrl: row.document_path ? (urls.get(row.document_path) ?? null) : null,
          source: row.source,
        }
      : null;
  };

  return {
    pickup: handoverOf("pickup"),
    delivery: handoverOf("delivery"),
    photos: photos.filter((photo) => photo.incidentId === null),
    incidents: incidents.data.map(
      (row): Incident => ({
        id: row.id,
        type: row.type,
        description: row.description,
        extraAmountCents: row.extra_amount_cents,
        occurredAt: row.occurred_at,
        status: row.status,
        resolutionNote: row.resolution_note,
        resolvedAt: row.resolved_at,
        source: row.source,
        photos: photos.filter((photo) => photo.incidentId === row.id),
      }),
    ),
  };
}

export type ExecutionResult<T = void> =
  | { ok: true; value: T }
  | { ok: false; error: "notFound" | "notOpen" | "wrongStatus" | "duplicate" | "invalid" | "upload" | "failed" };

type DbError = { code?: string; message?: string } | null;

function errorOf(error: DbError): ExecutionResult<never> {
  switch (error?.code) {
    case "P0002":
      return { ok: false, error: "notFound" };
    case "55000":
      // "job not open" (cerrado o cancelado) o un estado que no toca para ese paso
      return { ok: false, error: error.message?.includes("not open") || error.message?.includes("closed") ? "notOpen" : "wrongStatus" };
    case "23505":
      return { ok: false, error: "duplicate" };
    case "22023":
    case "23514":
      return { ok: false, error: "invalid" };
    default:
      console.error(`jobs: la base rechazó el registro (${error?.code ?? "sin código"})`);
      return { ok: false, error: "failed" };
  }
}

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Sube un fichero al bucket del trabajo con la sesión del administrador. Devuelve su ruta. */
export async function uploadJobFile(companyId: string, jobId: string, file: File): Promise<ExecutionResult<string>> {
  const extension = EXTENSIONS[file.type];
  if (!extension) return { ok: false, error: "invalid" };
  const path = `${companyId}/${jobId}/${crypto.randomUUID()}.${extension}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error(`jobs: no se pudo subir el fichero (${error.message})`);
    return { ok: false, error: "upload" };
  }
  return { ok: true, value: path };
}

/** Borra ficheros del bucket (tras eliminar su registro, o si el registro falló después de subir). */
export async function removeJobFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error(`jobs: no se pudieron borrar ficheros del bucket (${error.message})`);
}

/** RF-52, RF-55: acta de recogida o de entrega. */
export async function recordHandover(input: {
  jobId: string;
  moment: HandoverMoment;
  signerName: string;
  signedAt: string;
  remarks: string | null;
  documentPath: string | null;
}): Promise<ExecutionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("record_handover", {
    p_job_id: input.jobId,
    p_moment: input.moment,
    p_signer_name: input.signerName,
    p_signed_at: input.signedAt,
    // Opcionales: la función acepta null; el generador de tipos los marca como no nulos.
    p_remarks: input.remarks as string,
    p_document_path: input.documentPath as string,
  });
  return error ? errorOf(error) : { ok: true, value: undefined };
}

/** RF-51: foto de recogida, entrega o de una incidencia (el fichero ya está subido). */
export async function addEvidence(input: {
  jobId: string;
  moment: HandoverMoment | "incident";
  filePath: string;
  takenAt: string;
  incidentId: string | null;
}): Promise<ExecutionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("add_evidence", {
    p_job_id: input.jobId,
    p_moment: input.moment,
    p_file_path: input.filePath,
    p_taken_at: input.takenAt,
    p_incident_id: input.incidentId as string,
  });
  return error ? errorOf(error) : { ok: true, value: undefined };
}

/** RF-53: incidencia con tipo, descripción, importe adicional y hora. */
export async function reportIncident(input: {
  jobId: string;
  type: IncidentType;
  description: string;
  extraAmountCents: number;
  occurredAt: string;
}): Promise<ExecutionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("report_incident", {
    p_job_id: input.jobId,
    p_type: input.type,
    p_description: input.description,
    p_extra_amount_cents: input.extraAmountCents,
    p_occurred_at: input.occurredAt,
  });
  return error ? errorOf(error) : { ok: true, value: undefined };
}

/** P10: resolver la incidencia con una nota. */
export async function resolveIncident(incidentId: string, note: string): Promise<ExecutionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("resolve_incident", { p_incident_id: incidentId, p_note: note });
  return error ? errorOf(error) : { ok: true, value: undefined };
}

/** P9: elimina un registro hecho por error antes del cierre y borra sus ficheros del bucket. */
export async function deleteJobRecord(kind: "evidence" | "incident" | "handover", id: string): Promise<ExecutionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("delete_job_record", { p_kind: kind, p_id: id });
  if (error) return errorOf(error);
  await removeJobFiles(data ?? []);
  return { ok: true, value: undefined };
}
