"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import {
  addEvidence,
  deleteJobRecord,
  recordHandover,
  removeJobFiles,
  reportIncident,
  resolveIncident,
  uploadJobFile,
  type ExecutionResult,
} from "../../infrastructure/execution.repo";
import {
  descriptionSchema,
  incidentTypeSchema,
  momentSchema,
  noteSchema,
  parseAmount,
  parseBase,
  parseFiles,
  parseMoment,
  photoMomentSchema,
  readText,
  remarksSchema,
  signerSchema,
  type ExecutionState,
} from "../schemas/execution";

// Ejecución del trabajo desde el panel (paso 6.5, RF-51 a RF-53, RF-55). Cada acción comprueba sesión y rol en
// servidor (solo administradores), valida con zod y llama al repo; las funciones de la base comprueban otra vez el
// rol, el estado del trabajo y que nada cambia después del cierre (RF-57).

type Lang = Parameters<typeof localePath>[0];

const saved = (): ExecutionState => ({ status: "saved", at: Date.now() });
const failed = (error: Extract<ExecutionState, { status: "error" }>["error"]): ExecutionState => ({ status: "error", error });
const fromResult = (result: ExecutionResult<unknown>): ExecutionState => (result.ok ? saved() : failed(result.error === "invalid" ? "failed" : result.error));

/** La ficha del trabajo, la agenda y el pedido muestran el estado del trabajo: se refrescan los tres. */
function refresh(lang: Lang, orderId: string) {
  revalidatePath(localePath(lang, ROUTES.jobs.detail(orderId)));
  revalidatePath(localePath(lang, ROUTES.schedule));
  revalidatePath(localePath(lang, ROUTES.orders.detail(orderId)));
}

/** "Registar ata": recogida o entrega, con la foto opcional del acta en papel. */
export async function recordHandoverAction(_previous: ExecutionState, formData: FormData): Promise<ExecutionState> {
  const session = await requireCompanySession(formData.get("lang"));
  const base = parseBase(formData);
  const moment = momentSchema.safeParse(readText(formData, "moment"));
  if (!base.success || !moment.success) return failed("failed");
  const signer = signerSchema.safeParse(readText(formData, "signerName"));
  if (!signer.success) return failed("signerRequired");
  const when = parseMoment(formData);
  if (!when.ok) return failed(when.error);
  const remarks = remarksSchema.safeParse(readText(formData, "remarks"));
  if (!remarks.success) return failed("failed");
  const files = parseFiles(formData, "document", false);
  if (!files.ok) return failed(files.error);

  let documentPath: string | null = null;
  const [document] = files.files;
  if (document) {
    const upload = await uploadJobFile(session.companyId, base.data.jobId, document);
    if (!upload.ok) return failed(upload.error === "invalid" ? "fileType" : "upload");
    documentPath = upload.value;
  }

  const result = await recordHandover({
    jobId: base.data.jobId,
    moment: moment.data,
    signerName: signer.data,
    signedAt: when.at,
    remarks: remarks.data === "" ? null : remarks.data,
    documentPath,
  });
  // Si la base rechaza el acta, el fichero subido no queda huérfano
  if (!result.ok && documentPath) await removeJobFiles([documentPath]);
  if (result.ok) refresh(base.data.lang, base.data.orderId);
  return fromResult(result);
}

/** "Adicionar fotos": de recogida, de entrega o de una incidencia. Todas con la misma hora. */
export async function addPhotosAction(_previous: ExecutionState, formData: FormData): Promise<ExecutionState> {
  const session = await requireCompanySession(formData.get("lang"));
  const base = parseBase(formData);
  const moment = photoMomentSchema.safeParse(readText(formData, "moment"));
  const incidentId = z.union([z.literal(""), z.uuid()]).safeParse(readText(formData, "incidentId"));
  if (!base.success || !moment.success || !incidentId.success) return failed("failed");
  const when = parseMoment(formData);
  if (!when.ok) return failed(when.error);
  const files = parseFiles(formData, "photos", true);
  if (!files.ok) return failed(files.error);

  for (const file of files.files) {
    const upload = await uploadJobFile(session.companyId, base.data.jobId, file);
    if (!upload.ok) return failed(upload.error === "invalid" ? "fileType" : "upload");
    const result = await addEvidence({
      jobId: base.data.jobId,
      moment: moment.data,
      filePath: upload.value,
      takenAt: when.at,
      incidentId: incidentId.data === "" ? null : incidentId.data,
    });
    if (!result.ok) {
      await removeJobFiles([upload.value]);
      refresh(base.data.lang, base.data.orderId);
      return fromResult(result);
    }
  }
  refresh(base.data.lang, base.data.orderId);
  return saved();
}

/** "Registar incidência" (RF-53). */
export async function reportIncidentAction(_previous: ExecutionState, formData: FormData): Promise<ExecutionState> {
  await requireCompanySession(formData.get("lang"));
  const base = parseBase(formData);
  const type = incidentTypeSchema.safeParse(readText(formData, "type"));
  if (!base.success || !type.success) return failed("failed");
  const description = descriptionSchema.safeParse(readText(formData, "description"));
  if (!description.success) return failed("descriptionRequired");
  const amount = parseAmount(readText(formData, "amount"));
  if (amount === null) return failed("amountInvalid");
  const when = parseMoment(formData);
  if (!when.ok) return failed(when.error);

  const result = await reportIncident({
    jobId: base.data.jobId,
    type: type.data,
    description: description.data,
    extraAmountCents: amount,
    occurredAt: when.at,
  });
  if (result.ok) refresh(base.data.lang, base.data.orderId);
  return fromResult(result);
}

/** "Resolver" una incidencia con nota (P10). */
export async function resolveIncidentAction(_previous: ExecutionState, formData: FormData): Promise<ExecutionState> {
  await requireCompanySession(formData.get("lang"));
  const base = parseBase(formData);
  const incidentId = z.uuid().safeParse(readText(formData, "incidentId"));
  if (!base.success || !incidentId.success) return failed("failed");
  const note = noteSchema.safeParse(readText(formData, "note"));
  if (!note.success) return failed("noteRequired");

  const result = await resolveIncident(incidentId.data, note.data);
  if (result.ok) refresh(base.data.lang, base.data.orderId);
  return fromResult(result);
}

/** "Eliminar": foto, acta o incidencia registrada por error, antes del cierre (P9). */
export async function deleteRecordAction(_previous: ExecutionState, formData: FormData): Promise<ExecutionState> {
  await requireCompanySession(formData.get("lang"));
  const base = parseBase(formData);
  const kind = z.enum(["evidence", "incident", "handover"]).safeParse(readText(formData, "kind"));
  const id = z.uuid().safeParse(readText(formData, "recordId"));
  if (!base.success || !kind.success || !id.success) return failed("failed");

  const result = await deleteJobRecord(kind.data, id.data);
  if (result.ok) refresh(base.data.lang, base.data.orderId);
  return fromResult(result);
}
