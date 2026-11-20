"use client";

import { startTransition, useActionState, type FormEvent } from "react";

import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { closeJobAction } from "../../application/actions/execution";
import type { ExecutionState } from "../../application/schemas/execution";
import type { JobsText } from "../job-summary-text";

type Props = {
  lang: Locale;
  jobId: string;
  orderId: string;
  /** Estimado del orçamento, ya formateado ("5,5"), como sugerencia en los campos. */
  estimate: { hours: string; km: string };
  openIncidents: number;
  t: {
    /** Textos de "Falta fechar" del panel de la Agenda. */
    close: { hours: string; km: string; estimated: string; noIncidents: string; action: string; notes: string; notesPlaceholder: string; openIncidents: string; saving: string; confirm: string };
    errors: JobsText["execution"]["errors"];
  };
};

const IDLE: ExecutionState = { status: "idle" };
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * "Fechar trabalho" (paso 6.6, RF-58, RF-59): horas y km reales obligatorios y nota opcional. Con incidencias abiertas
 * no se puede cerrar (la base lo comprueba otra vez). Después nada del trabajo cambia (RF-57).
 */
export function CloseJobForm({ lang, jobId, orderId, estimate, openIncidents, t }: Props) {
  const [state, action, pending] = useActionState(closeJobAction, IDLE);
  const c = t.close;
  const blocked = openIncidents > 0;

  // Sin el restablecimiento automático de React 19: tras un error, lo escrito sigue en pantalla
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };

  const fields = [
    { key: "hours", label: c.hours, unit: "h", est: estimate.hours },
    { key: "km", label: c.km, unit: "km", est: estimate.km },
  ] as const;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid grid-cols-2 gap-2.5">
        {fields.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-[13px] font-bold">
            {field.label}
            <span className={`flex h-10.5 items-center overflow-hidden rounded-xl border border-field-border bg-surface font-normal focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary`}>
              <input
                name={field.key}
                inputMode="decimal"
                autoComplete="off"
                placeholder={field.est}
                disabled={blocked}
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] font-bold outline-none placeholder:text-field-placeholder"
              />
              <span className="px-2.5 text-[13px] text-muted">{field.unit}</span>
            </span>
            <span className="text-xs font-normal text-muted">{interpolate(c.estimated, { value: field.est, unit: field.unit })}</span>
          </label>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-[13px] font-bold">
        {c.notes}
        <textarea
          name="notes"
          rows={2}
          maxLength={2000}
          placeholder={c.notesPlaceholder}
          disabled={blocked}
          className={`rounded-xl border border-field-border bg-surface px-3 py-2 text-[15px] font-normal ${focusRing}`}
        />
      </label>
      {blocked ? (
        <p className="rounded-xl border border-warn-border bg-warn-surface px-3 py-2 text-[13px] font-bold text-warn-foreground">
          {interpolate(c.openIncidents, { count: openIncidents })}
        </p>
      ) : (
        <span className="flex items-center gap-2 text-[13px] font-bold text-success-foreground">
          <span aria-hidden className="grid size-5 place-items-center rounded-full bg-success-dot text-[11px] text-white">
            ✓
          </span>
          {c.noIncidents}
        </span>
      )}
      <p className="text-xs leading-snug text-muted">{c.confirm}</p>
      {state.status === "error" ? (
        <p role="alert" className="text-[13px] font-bold text-danger-foreground">
          {t.errors[state.error]}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || blocked}
        className={`h-10.5 w-fit cursor-pointer rounded-full bg-foreground px-4.5 text-sm font-bold text-background disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
      >
        {pending ? c.saving : c.action}
      </button>
    </form>
  );
}
