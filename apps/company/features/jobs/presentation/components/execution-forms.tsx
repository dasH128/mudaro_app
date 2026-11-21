"use client";

import { DateField } from "@mudaro/ui";
import { startTransition, useActionState, useState, type FormEvent } from "react";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import {
  addPhotosAction,
  deleteRecordAction,
  recordHandoverAction,
  reportIncidentAction,
  resolveIncidentAction,
} from "../../application/actions/execution";
import type { ExecutionState } from "../../application/schemas/execution";
import { INCIDENT_TYPES, type HandoverMoment } from "../../domain/execution";
import type { JobsText } from "../job-summary-text";

// Formularios de la ejecución del trabajo (paso 6.5). Se envían sin el restablecimiento automático de React 19: tras
// un error, lo escrito sigue en pantalla. Tras guardar, la ficha se vuelve a pintar con los datos nuevos.

type ExecutionText = JobsText["execution"];

/** Lo que todos los formularios mandan: idioma, trabajo y pedido (para refrescar su ficha). */
export type JobRef = { lang: Locale; jobId: string; orderId: string };

/** Día de hoy (dd/mm/aaaa) y hora actual (hh:mm) de Lisboa, calculados en servidor para no romper la hidratación. */
export type Now = { date: string; time: string };

const IDLE: ExecutionState = { status: "idle" };
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const input = `h-10.5 rounded-xl border border-field-border bg-surface px-3 text-[15px] text-foreground ${focusRing}`;
const label = "flex flex-col gap-1 text-[13px] font-bold";
const primary = `inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-foreground px-4.5 text-sm font-bold text-background disabled:cursor-wait disabled:opacity-70 ${focusRing}`;
const secondary = `inline-flex h-10 cursor-pointer items-center rounded-full border border-field-border bg-surface px-4 text-sm font-bold text-foreground ${focusRing}`;

/** Lado máximo de las fotos comprimidas en el navegador. */
const MAX_SIDE = 1600;

/** Reduce una foto a JPEG de 1600 px como mucho. Si el navegador no sabe abrirla (p. ej. HEIC en Chrome), la deja igual. */
async function compress(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

/** Envía el formulario a la acción, comprimiendo antes las fotos de los campos indicados. */
function useSubmit(action: (formData: FormData) => void, fileFields: string[] = []) {
  const [preparing, setPreparing] = useState(false);
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (fileFields.length > 0) {
      setPreparing(true);
      for (const name of fileFields) {
        const files = formData.getAll(name).filter((item): item is File => item instanceof File && item.size > 0);
        formData.delete(name);
        for (const file of files) formData.append(name, await compress(file));
      }
      setPreparing(false);
    }
    startTransition(() => action(formData));
  };
  return { onSubmit, preparing };
}

function Hidden({ job, extra = {} }: { job: JobRef; extra?: Record<string, string> }) {
  return (
    <>
      {Object.entries({ lang: job.lang, jobId: job.jobId, orderId: job.orderId, ...extra }).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}

function Feedback({ state, t }: { state: ExecutionState; t: ExecutionText }) {
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="text-[13px] font-bold text-danger-foreground">
      {t.errors[state.error]}
    </p>
  );
}

function WhenFields({ now, t, legend }: { now: Now; t: ExecutionText; legend: string }) {
  return (
    <fieldset className="grid grid-cols-[1.4fr_1fr] gap-2">
      <legend className="mb-1 text-[13px] font-bold">{legend}</legend>
      <label className={label}>
        <span className="sr-only">{t.date}</span>
        <DateField name="date" defaultValue={now.date} aria-label={t.date} className={input} />
      </label>
      <label className={label}>
        <span className="sr-only">{t.time}</span>
        <input name="time" type="time" defaultValue={now.time} aria-label={t.time} className={input} />
      </label>
    </fieldset>
  );
}

/** Acta de recogida o de entrega (RF-52, RF-55): quién firma, cuándo, observaciones y foto del acta en papel. */
export function HandoverForm({ job, moment, now, t, defaultSigner }: { job: JobRef; moment: HandoverMoment; now: Now; t: ExecutionText; defaultSigner: string }) {
  const [state, action, pending] = useActionState(recordHandoverAction, IDLE);
  const { onSubmit, preparing } = useSubmit(action, ["document"]);
  const busy = pending || preparing;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface-soft p-4">
      <Hidden job={job} extra={{ moment }} />
      <label className={label}>
        {t.signer}
        <input name="signerName" defaultValue={defaultSigner} maxLength={120} autoComplete="off" className={input} />
      </label>
      <WhenFields now={now} t={t} legend={t.signedAt} />
      <label className={label}>
        {t.remarks}
        <textarea name="remarks" rows={2} maxLength={1000} placeholder={t.remarksPlaceholder} className={`${input} h-auto py-2`} />
      </label>
      <label className={label}>
        {t.document}
        <input name="document" type="file" accept="image/*" capture="environment" className="text-[13px] font-normal" />
        <span className="text-xs font-normal text-muted">{t.documentHint}</span>
      </label>
      <Feedback state={state} t={t} />
      <span className="flex justify-end">
        <button type="submit" disabled={busy} className={primary}>
          {busy ? t.saving : moment === "pickup" ? t.recordPickup : t.recordDelivery}
        </button>
      </span>
    </form>
  );
}

/** Fotos de recogida, entrega o de una incidencia (RF-51). */
export function PhotoForm({ job, moment, incidentId, now, t }: { job: JobRef; moment: HandoverMoment | "incident"; incidentId?: string; now: Now; t: ExecutionText }) {
  const [state, action, pending] = useActionState(addPhotosAction, IDLE);
  const [open, setOpen] = useState(false);
  const { onSubmit, preparing } = useSubmit(action, ["photos"]);
  const busy = pending || preparing;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${secondary} w-fit gap-2`}>
        <Icon name="camera" size={16} strokeWidth={2.2} />
        {t.addPhotos}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface-soft p-4">
      <Hidden job={job} extra={{ moment, incidentId: incidentId ?? "" }} />
      <label className={label}>
        {t.photos}
        <input name="photos" type="file" accept="image/*" multiple required className="text-[13px] font-normal" />
        <span className="text-xs font-normal text-muted">{t.photosHint}</span>
      </label>
      <WhenFields now={now} t={t} legend={t.takenAt} />
      <Feedback state={state} t={t} />
      {state.status === "saved" ? <span role="status" className="text-[13px] text-success-foreground">{t.saved}</span> : null}
      <span className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className={secondary}>
          {t.close}
        </button>
        <button type="submit" disabled={busy} className={primary}>
          {preparing ? t.preparing : pending ? t.saving : t.upload}
        </button>
      </span>
    </form>
  );
}

/** Incidencia (RF-53): tipo, descripción, importe adicional y hora. */
export function IncidentForm({ job, now, t }: { job: JobRef; now: Now; t: ExecutionText }) {
  const [state, action, pending] = useActionState(reportIncidentAction, IDLE);
  const [open, setOpen] = useState(false);
  const { onSubmit } = useSubmit(action);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${secondary} w-fit`}>
        {t.reportIncident}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface-soft p-4">
      <Hidden job={job} />
      <div className="grid grid-cols-[1.4fr_1fr] gap-2">
        <label className={label}>
          {t.incidentType}
          <select name="type" defaultValue="damage" className={input}>
            {INCIDENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t.incidentTypes[type]}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t.amount}
          <span className="flex h-10.5 items-center overflow-hidden rounded-xl border border-field-border bg-surface font-normal focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
            <input name="amount" inputMode="decimal" placeholder="0,00" autoComplete="off" className="min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none" />
            <span className="px-2.5 text-[13px] text-muted">€</span>
          </span>
        </label>
      </div>
      <label className={label}>
        {t.description}
        <textarea name="description" rows={2} maxLength={1000} placeholder={t.descriptionPlaceholder} className={`${input} h-auto py-2`} />
      </label>
      <WhenFields now={now} t={t} legend={t.occurredAt} />
      <p className="text-xs leading-snug text-muted">{t.incidentHint}</p>
      <Feedback state={state} t={t} />
      <span className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className={secondary}>
          {t.close}
        </button>
        <button type="submit" disabled={pending} className={primary}>
          {pending ? t.saving : t.saveIncident}
        </button>
      </span>
    </form>
  );
}

/** Resolver una incidencia con una nota (P10). */
export function ResolveForm({ job, incidentId, t }: { job: JobRef; incidentId: string; t: ExecutionText }) {
  const [state, action, pending] = useActionState(resolveIncidentAction, IDLE);
  const [open, setOpen] = useState(false);
  const { onSubmit } = useSubmit(action);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${secondary} h-9 w-fit text-[13px]`}>
        {t.resolve}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <Hidden job={job} extra={{ incidentId }} />
      <label className={label}>
        {t.resolutionNote}
        <textarea name="note" rows={2} maxLength={1000} placeholder={t.resolutionPlaceholder} className={`${input} h-auto py-2`} />
      </label>
      <Feedback state={state} t={t} />
      <span className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className={`${secondary} h-9 text-[13px]`}>
          {t.close}
        </button>
        <button type="submit" disabled={pending} className={`${primary} h-9 text-[13px]`}>
          {pending ? t.saving : t.markResolved}
        </button>
      </span>
    </form>
  );
}

/** Eliminar un registro hecho por error (P9). Dos pasos en el propio botón, sin ventanas del navegador. */
export function DeleteRecord({ job, kind, id, t, label: text }: { job: JobRef; kind: "evidence" | "incident" | "handover"; id: string; t: ExecutionText; label: string }) {
  const [state, action, pending] = useActionState(deleteRecordAction, IDLE);
  const [confirming, setConfirming] = useState(false);
  const { onSubmit } = useSubmit(action);

  return (
    <form onSubmit={onSubmit} className="flex flex-col items-start gap-1">
      <Hidden job={job} extra={{ kind, recordId: id }} />
      {confirming ? (
        <span className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted">{t.confirmDelete}</span>
          <button type="submit" disabled={pending} className={`cursor-pointer font-bold text-danger-foreground underline ${focusRing}`}>
            {pending ? t.deleting : t.yesDelete}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={`cursor-pointer font-bold underline ${focusRing}`}>
            {t.no}
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={`cursor-pointer text-[13px] font-bold text-danger-foreground underline ${focusRing}`}>
          {text}
        </button>
      )}
      <Feedback state={state} t={t} />
    </form>
  );
}
