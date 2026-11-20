"use client";

import { useActionState, useState } from "react";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { formatPhone } from "@/app/lib/format";
import { updateCrewAction } from "../../application/actions/crew";
import type { CrewField, CrewFormState, CrewFormValues } from "../../application/schemas/crew";
import { POSITIONS, type Member } from "../../domain/types";
import type { TeamText } from "../team-text";

type Props = {
  lang: Locale;
  member: Pick<Member, "id" | "name" | "phone" | "position">;
  /** Solo los textos que usa el formulario: el resto del diccionario no viaja al cliente. */
  t: {
    data: TeamText["panel"]["data"];
    errors: TeamText["panel"]["errors"];
    positions: TeamText["positions"];
  };
};

const IDLE: CrewFormState = { status: "idle" };

const label = "flex flex-col gap-1 text-[13px] font-bold";
const box =
  "h-10.5 rounded-xl bg-transparent px-3 text-[15px] font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const heading = "text-base font-bold";

/** "Dados" del panel de la persona (paso 6.0b): cada campo se guarda al salir de él, y la función al elegirla. */
export function CrewDataForm({ lang, member, t }: Props) {
  const [state, formAction, pending] = useActionState(updateCrewAction, IDLE);
  const [values, setValues] = useState<CrewFormValues>(() => ({
    name: member.name,
    phone: member.phone ? formatPhone(member.phone) : "",
    position: member.position,
  }));
  // Últimos valores enviados: salir de un campo sin cambiarlo no vuelve a guardar
  const [sent, setSent] = useState<CrewFormValues>(values);

  const errors = state.status === "error" ? state.fieldErrors : {};
  const formError = state.status === "error" ? state.formError : undefined;
  const missingPhone = values.phone.trim() === "";

  function save(next: CrewFormValues, form: HTMLFormElement | null) {
    const same = next.name === sent.name && next.phone === sent.phone && next.position === sent.position;
    if ((same && state.status !== "error") || !form) return;
    setSent(next);
    form.requestSubmit();
  }

  const errorId = (field: CrewField) => `crew-${field}-error`;
  const border = (field: CrewField, warn = false) =>
    errors[field] ? "border-2 border-danger-border" : warn ? "border-2 border-warn-border bg-warn-surface" : "border border-field-border";
  const inputProps = (field: "name" | "phone") => ({
    id: `crew-${field}`,
    name: field,
    value: values[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [field]: event.target.value })),
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => save(values, event.currentTarget.form),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? errorId(field) : undefined,
  });

  const status = pending ? t.data.saving : state.status === "saved" ? t.data.saved : t.data.saveOnBlur;

  return (
    <form action={formAction} noValidate aria-labelledby="person-data" className="flex flex-col gap-3">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="crewId" value={member.id} />

      <div className="flex items-baseline justify-between gap-2">
        <h3 id="person-data" className={heading}>
          {t.data.title}
        </h3>
        <span role="status" className="flex items-center gap-1 text-xs text-muted">
          {state.status === "saved" && !pending ? <Icon name="check" size={12} strokeWidth={2.6} /> : null}
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <label className={`${label} col-span-2`} htmlFor="crew-name">
          {t.data.name}
          <input {...inputProps("name")} autoComplete="off" maxLength={80} className={`${box} ${border("name")}`} />
          {errors.name ? (
            <span id={errorId("name")} className="text-xs font-normal text-danger-foreground">
              {t.errors[errors.name]}
            </span>
          ) : null}
        </label>
        <label className={label} htmlFor="crew-phone">
          {t.data.phone}
          <input
            {...inputProps("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder={t.data.phonePlaceholder}
            className={`${box} ${border("phone", missingPhone)}`}
          />
          {errors.phone ? (
            <span id={errorId("phone")} className="text-xs font-normal text-danger-foreground">
              {t.errors[errors.phone]}
            </span>
          ) : null}
        </label>
        <label className={label} htmlFor="crew-position">
          {t.data.position}
          <select
            id="crew-position"
            name="position"
            value={values.position}
            onChange={(event) => {
              const next = { ...values, position: event.target.value as CrewFormValues["position"] };
              setValues(next);
              save(next, event.currentTarget.form);
            }}
            className={`${box} border border-field-border bg-surface`}
          >
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {t.positions[position]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {missingPhone && !errors.phone ? <span className="text-[13px] font-bold text-warn-foreground">{t.data.phoneMissing}</span> : null}
      {formError ? (
        <p role="alert" className="text-[13px] font-bold text-danger-foreground">
          {t.data.formErrors[formError]}
        </p>
      ) : null}
    </form>
  );
}
