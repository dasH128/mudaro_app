"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { createCrewAction } from "../../application/actions/crew";
import { NAME_MAX, type CrewField, type CrewFormState, type CrewFormValues } from "../../application/schemas/crew";
import { POSITIONS } from "../../domain/types";
import type { TeamText } from "../team-text";

type Props = {
  lang: Locale;
  /** Solo los textos del alta: el resto del diccionario no viaja al cliente. */
  t: {
    team: string;
    n: TeamText["newPerson"];
    errors: TeamText["panel"]["errors"];
    formErrors: TeamText["panel"]["data"]["formErrors"];
    positions: TeamText["positions"];
  };
};

const IDLE: CrewFormState = { status: "idle" };

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const link = `font-bold text-foreground underline ${focusRing}`;
const label = "flex flex-col gap-1.5 text-sm font-bold";
const input = `h-12 rounded-xl bg-surface px-3.5 text-base font-normal text-foreground ${focusRing}`;
const hint = "text-[13px] font-normal text-muted";
const errorText = "text-[13px] font-normal text-danger-foreground";

/** "Nova pessoa" (paso 6.0b): nombre, telemóvel opcional y función. Sin prototipo: sigue la línea de Novo veículo. */
export function NewPersonForm({ lang, t }: Props) {
  const [state, formAction, pending] = useActionState(createCrewAction, IDLE);
  const [values, setValues] = useState<CrewFormValues>({ name: "", phone: "", position: "driver" });
  const firstErrorRef = useRef<HTMLParagraphElement>(null);

  const errors = state.status === "error" ? state.fieldErrors : {};
  const formError = state.status === "error" ? state.formError : undefined;

  // Lleva el foco al aviso cuando el servidor rechaza el envío sin errores de campo
  useEffect(() => {
    if (formError) firstErrorRef.current?.focus();
  }, [formError, state]);

  const errorId = (field: CrewField) => `new-person-${field}-error`;
  const border = (field: CrewField) => (errors[field] ? "border-2 border-danger-border" : "border border-field-border");

  return (
    <>
      <header className="flex flex-col gap-2.5">
        <nav aria-label={t.n.breadcrumb} className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link href={localePath(lang, ROUTES.team.list)} className={link}>
            {t.team}
          </Link>
          <Icon name="chevronRight" size={14} />
          <span aria-current="page">{t.n.title}</span>
        </nav>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{t.n.title}</h1>
        <p className="max-w-[60ch] text-base text-muted">{t.n.intro}</p>
      </header>

      <form
        action={formAction}
        noValidate
        className="flex max-w-xl flex-col gap-5 rounded-[22px] border border-line bg-surface p-5.5 sm:p-7"
      >
        <input type="hidden" name="lang" value={lang} />

        <label className={label} htmlFor="new-person-name">
          {t.n.name}
          <input
            id="new-person-name"
            name="name"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            placeholder={t.n.namePlaceholder}
            maxLength={NAME_MAX}
            autoComplete="off"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? errorId("name") : undefined}
            className={`${input} ${border("name")}`}
          />
          {errors.name ? (
            <span id={errorId("name")} className={errorText}>
              {t.errors[errors.name]}
            </span>
          ) : null}
        </label>

        <label className={label} htmlFor="new-person-phone">
          {t.n.phone}
          <input
            id="new-person-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
            placeholder={t.n.phonePlaceholder}
            autoComplete="off"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? errorId("phone") : "new-person-phone-hint"}
            className={`${input} ${border("phone")}`}
          />
          {errors.phone ? (
            <span id={errorId("phone")} className={errorText}>
              {t.errors[errors.phone]}
            </span>
          ) : (
            <span id="new-person-phone-hint" className={hint}>
              {t.n.phoneHint}
            </span>
          )}
        </label>

        <fieldset className="flex flex-col gap-2" aria-describedby="new-person-position-hint">
          <legend className="mb-1.5 text-sm font-bold">{t.n.position}</legend>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((position) => (
              <label
                key={position}
                className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-bold has-checked:border-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary ${
                  "border-field-border bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name="position"
                  value={position}
                  checked={values.position === position}
                  onChange={() => setValues((current) => ({ ...current, position }))}
                  className="sr-only"
                />
                {t.positions[position]}
              </label>
            ))}
          </div>
          <span id="new-person-position-hint" className={hint}>
            {t.n.positionHint}
          </span>
        </fieldset>

        {formError ? (
          <p ref={firstErrorRef} tabIndex={-1} role="alert" className="text-sm font-bold text-danger-foreground">
            {t.formErrors[formError]}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2.5 border-t border-line-soft pt-5">
          <Link
            href={localePath(lang, ROUTES.team.list)}
            className={`inline-flex h-12 items-center rounded-full border border-field-border bg-surface px-5 text-[15px] font-bold text-foreground ${focusRing}`}
          >
            {t.n.cancel}
          </Link>
          <button
            type="submit"
            disabled={pending}
            className={`inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-bold text-primary-foreground shadow-md disabled:cursor-wait disabled:opacity-70 ${focusRing}`}
          >
            <Icon name="userPlus" size={18} strokeWidth={2.4} />
            {pending ? t.n.saving : t.n.submit}
          </button>
        </div>
      </form>
    </>
  );
}
