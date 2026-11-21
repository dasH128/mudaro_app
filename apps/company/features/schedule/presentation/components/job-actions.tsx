"use client";

import { DateField } from "@mudaro/ui";
import { startTransition, useActionState, useState, type FormEvent } from "react";

import { interpolate } from "@/app/i18n/interpolate";
import type { Locale } from "@/app/i18n/config";
import { assignJobAction, cancelJobAction, rescheduleJobAction } from "../../application/actions/schedule";
import type { ScheduleActionState, ScheduleError } from "../../application/schemas/schedule";
import type { ScheduleText } from "../schedule-text";

/** Un vehículo o una persona que se puede elegir, con su línea de detalle ya escrita ("ocupado 09:00–13:00 · MD-0836"). */
export type Option = { id: string; name: string; sub: string; busy: boolean };

type Props = {
  lang: Locale;
  job: { jobId: string; date: string; start: string; end: string; vehicleId: string | null; crewIds: string[]; leadId: string | null };
  /** Solo trabajos programados se reprograman o cancelan; en curso, solo se cambia el equipo. */
  canReschedule: boolean;
  vehicles: Option[];
  people: Option[];
  t: ScheduleText["panel"]["edit"];
};

const IDLE: ScheduleActionState = { status: "idle" };

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const primary = `inline-flex h-10 cursor-pointer items-center rounded-full bg-foreground px-4.5 text-sm font-bold text-background disabled:cursor-wait disabled:opacity-70 ${focusRing}`;
const secondary = `inline-flex h-10 cursor-pointer items-center rounded-full border border-field-border bg-surface px-4 text-sm font-bold text-foreground ${focusRing}`;
const danger = `inline-flex h-10 cursor-pointer items-center rounded-full bg-danger-foreground px-4.5 text-sm font-bold text-background disabled:cursor-wait disabled:opacity-70 ${focusRing}`;
const input = `h-10.5 rounded-xl border border-field-border bg-surface px-3 text-[15px] text-foreground ${focusRing}`;
const box = "flex flex-col gap-3 rounded-[18px] border border-line bg-surface-soft p-4";
const legend = "mb-1 text-[13px] font-bold";

/** "dd/mm/aaaa" de un día aaaa-mm-dd, para el campo de la fecha (RNF-10). */
const toPt = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

function ErrorText({ state, t, names }: { state: ScheduleActionState; t: Props["t"]; names: Map<string, string> }) {
  if (state.status !== "error") return null;
  const message = interpolate(t.errors[state.error satisfies ScheduleError], {
    name: (state.name && names.get(state.name)) ?? t.someone,
    orderId: state.orderId ?? t.otherJob,
  });
  return (
    <p role="alert" className="text-[13px] font-bold text-danger-foreground">
      {message}
    </p>
  );
}

function Hidden({ lang, jobId }: { lang: Locale; jobId: string }) {
  return (
    <>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="jobId" value={jobId} />
    </>
  );
}

type Mode = "none" | "crew" | "reschedule" | "cancel";

/**
 * Envía el formulario a la acción sin el restablecimiento automático de React 19: tras un error, lo elegido y lo
 * escrito siguen en pantalla.
 */
const submitWith = (action: (formData: FormData) => void) => (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  startTransition(() => action(formData));
};

/** Acciones del panel del trabajo (paso 6.2): equipo y vehículo, reprogramar y cancelar (RF-48, RF-50). */
export function JobActions({ lang, job, canReschedule, vehicles, people, t }: Props) {
  const [mode, setMode] = useState<Mode>("none");
  const [assignState, assignAction, assigning] = useActionState(assignJobAction, IDLE);
  const [rescheduleState, rescheduleAction, rescheduling] = useActionState(rescheduleJobAction, IDLE);
  const [cancelState, cancelAction, cancelling] = useActionState(cancelJobAction, IDLE);

  const [vehicleId, setVehicleId] = useState(job.vehicleId ?? "");
  const [crewIds, setCrewIds] = useState<string[]>(job.crewIds);
  const [leadId, setLeadId] = useState(job.leadId ?? "");

  const names = new Map([...vehicles, ...people].map((option) => [option.id, option.name]));
  const toggle = (id: string) => setCrewIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  const leadOptions = people.filter((person) => crewIds.includes(person.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-expanded={mode === "crew"} onClick={() => setMode(mode === "crew" ? "none" : "crew")} className={secondary}>
          {t.editCrew}
        </button>
        {canReschedule ? (
          <>
            <button type="button" aria-expanded={mode === "reschedule"} onClick={() => setMode(mode === "reschedule" ? "none" : "reschedule")} className={secondary}>
              {t.reschedule.title}
            </button>
            <button
              type="button"
              aria-expanded={mode === "cancel"}
              onClick={() => setMode(mode === "cancel" ? "none" : "cancel")}
              className={`h-10 cursor-pointer px-1.5 text-[13px] font-bold text-danger-foreground underline ${focusRing}`}
            >
              {t.cancel.title}
            </button>
          </>
        ) : null}
        {assignState.status === "saved" && mode === "none" ? <span role="status" className="text-[13px] text-success-foreground">{t.saved}</span> : null}
      </div>

      {mode === "crew" ? (
        <form onSubmit={submitWith(assignAction)} className={box}>
          <Hidden lang={lang} jobId={job.jobId} />

          <fieldset className="flex flex-col gap-1.5">
            <legend className={legend}>{t.vehicle}</legend>
            {[{ id: "", name: t.noVehicle, sub: "", busy: false }, ...vehicles].map((option) => (
              <label key={option.id || "none"} className="flex cursor-pointer items-start gap-2.5 rounded-xl px-1 py-1 text-sm">
                <input
                  type="radio"
                  name="vehicleId"
                  value={option.id}
                  checked={vehicleId === option.id}
                  onChange={() => setVehicleId(option.id)}
                  className="mt-0.5 size-4 accent-foreground"
                />
                <span className="flex flex-col">
                  <strong>{option.name}</strong>
                  {option.sub ? <span className={`text-xs ${option.busy ? "font-bold text-warn-foreground" : "text-muted"}`}>{option.sub}</span> : null}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-1.5">
            <legend className={legend}>{t.crew}</legend>
            {people.length === 0 ? <p className="text-[13px] text-muted">{t.noPeople}</p> : null}
            {people.map((option) => (
              <label key={option.id} className="flex cursor-pointer items-start gap-2.5 rounded-xl px-1 py-1 text-sm">
                <input
                  type="checkbox"
                  name="crewIds"
                  value={option.id}
                  checked={crewIds.includes(option.id)}
                  onChange={() => toggle(option.id)}
                  className="mt-0.5 size-4 accent-foreground"
                />
                <span className="flex flex-col">
                  <strong>{option.name}</strong>
                  <span className={`text-xs ${option.busy ? "font-bold text-warn-foreground" : "text-muted"}`}>{option.sub}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {leadOptions.length > 0 ? (
            <label className="flex flex-col gap-1 text-[13px] font-bold">
              {t.lead}
              <select name="leadId" value={crewIds.includes(leadId) ? leadId : ""} onChange={(event) => setLeadId(event.target.value)} className={input}>
                <option value="">{t.noLead}</option>
                {leadOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="leadId" value="" />
          )}

          <ErrorText state={assignState} t={t} names={names} />
          <p className="text-xs leading-snug text-muted">{t.crewHint}</p>
          <span className="flex flex-wrap justify-end gap-2">
            <button type="button" className={secondary} onClick={() => setMode("none")}>
              {t.close}
            </button>
            <button type="submit" disabled={assigning} className={primary}>
              {assigning ? t.saving : t.save}
            </button>
          </span>
        </form>
      ) : null}

      {mode === "reschedule" ? (
        <form onSubmit={submitWith(rescheduleAction)} className={box}>
          <Hidden lang={lang} jobId={job.jobId} />
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
            <label className="flex flex-col gap-1 text-[13px] font-bold">
              {t.reschedule.date}
              <DateField name="date" defaultValue={toPt(job.date)} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-[13px] font-bold">
              {t.reschedule.start}
              <input name="start" type="time" step={900} defaultValue={job.start} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-[13px] font-bold">
              {t.reschedule.end}
              <input name="end" type="time" step={900} defaultValue={job.end} className={input} />
            </label>
          </div>
          <p className="text-xs leading-snug text-muted">{t.reschedule.note}</p>
          <ErrorText state={rescheduleState} t={t} names={names} />
          {rescheduleState.status === "saved" ? <span role="status" className="text-[13px] text-success-foreground">{t.saved}</span> : null}
          <span className="flex flex-wrap justify-end gap-2">
            <button type="button" className={secondary} onClick={() => setMode("none")}>
              {t.close}
            </button>
            <button type="submit" disabled={rescheduling} className={primary}>
              {rescheduling ? t.saving : t.reschedule.save}
            </button>
          </span>
        </form>
      ) : null}

      {mode === "cancel" ? (
        <form onSubmit={submitWith(cancelAction)} className="flex flex-col gap-3 rounded-[18px] border border-danger-border bg-danger-surface p-4">
          <Hidden lang={lang} jobId={job.jobId} />
          <label className="flex flex-col gap-1 text-[13px] font-bold">
            {t.cancel.reason}
            <textarea name="reason" rows={2} maxLength={500} placeholder={t.cancel.reasonPlaceholder} className={`${input} h-auto py-2`} />
          </label>
          <p className="text-xs leading-snug text-muted">{t.cancel.note}</p>
          <ErrorText state={cancelState} t={t} names={names} />
          <span className="flex flex-wrap justify-end gap-2">
            <button type="button" className={secondary} onClick={() => setMode("none")}>
              {t.cancel.back}
            </button>
            <button type="submit" disabled={cancelling} className={danger}>
              {t.cancel.confirm}
            </button>
          </span>
        </form>
      ) : null}
    </div>
  );
}
