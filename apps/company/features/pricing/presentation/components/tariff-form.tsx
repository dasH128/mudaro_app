"use client";

import { useActionState, useState } from "react";

import { ChoiceGroup } from "@/app/components/form/choice-group";
import { Field, describedBy } from "@/app/components/form/field";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { formatPercent } from "@/app/lib/format";
import { parseDecimal } from "@/features/fleet/domain/new-vehicle";
import { saveTariffAction } from "../../application/actions/pricing";
import type { TariffFormState, TariffNumberField, TariffValues } from "../../application/schemas/tariff";
import { QUOTE_PRESENTATIONS, hourMargin } from "../../domain/types";
import type { PricingText } from "../pricing-text";

type Props = {
  lang: Locale;
  t: PricingText;
  initial: TariffValues;
};

const IDLE: TariffFormState = { status: "idle" };
const card = "flex min-w-0 flex-col gap-4 rounded-[22px] border border-line bg-surface p-6";
const heading = "font-display text-[22px] font-extrabold";

type FieldDef = { name: TariffNumberField; unit: string; hint?: string };

/** Campo numérico con su unidad al final (€/h, %, m³). */
function NumberField({
  t,
  def,
  value,
  error,
  onChange,
}: {
  t: PricingText;
  def: FieldDef;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
}) {
  const id = `tariff-${def.name}`;
  return (
    <Field id={id} label={t.fields[def.name]} hint={def.hint} error={error}>
      <span
        className={`flex h-12 items-center overflow-hidden rounded-xl border bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${error ? "border-danger-dot" : "border-field-border"}`}
      >
        <input
          id={id}
          name={def.name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { hint: Boolean(def.hint), error: Boolean(error) })}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-base font-bold text-foreground outline-none"
        />
        <span aria-hidden="true" className="px-3.5 text-sm text-muted">
          {def.unit}
        </span>
      </span>
    </Field>
  );
}

// RF-06: la tarifa con la que se calculan los orçamentos. Guardar crea la versión siguiente; los enviados no cambian.
export function TariffForm({ lang, t, initial }: Props) {
  const [state, formAction, pending] = useActionState(saveTariffAction, IDLE);
  const [values, setValues] = useState<TariffValues>(initial);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const u = t.units;

  const set = (name: keyof TariffValues, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const error = (name: TariffNumberField) => (errors[name] ? t.errors[errors[name]] : undefined);

  const margin = hourMargin({
    operatorHourPriceCents: Math.round(parseDecimal(values.operatorHourPriceCents) * 100),
    operatorHourCostCents: Math.round(parseDecimal(values.operatorHourCostCents) * 100),
  });

  const sections: { key: keyof PricingText["sections"]; fields: FieldDef[] }[] = [
    {
      key: "prices",
      fields: [
        { name: "operatorHourPriceCents", unit: u.perHour },
        { name: "operatorHourCostCents", unit: u.perHour },
        { name: "kmPriceCents", unit: u.perKm },
        { name: "minimumServiceCents", unit: u.euros, hint: t.hints.minimumServiceCents },
        { name: "vatPct", unit: u.pct },
      ],
    },
    {
      key: "access",
      fields: [
        { name: "noLiftFloorSurchargeCents", unit: u.euros },
        { name: "parkingSurchargeCents", unit: u.euros },
        { name: "noLiftFloorExtraPct", unit: u.pct },
        { name: "parkingExtraPctPer25m", unit: u.pct },
      ],
    },
    {
      key: "calculation",
      fields: [
        { name: "stowageFactor", unit: "×", hint: t.hints.stowageFactor },
        { name: "averageSpeedKmh", unit: u.kmh },
      ],
    },
  ];

  const crew: FieldDef[][] = [
    [{ name: "crewSmallMaxM3", unit: u.m3 }, { name: "crewSmall", unit: "" }],
    [{ name: "crewMediumMaxM3", unit: u.m3 }, { name: "crewMedium", unit: "" }],
    [{ name: "crewLarge", unit: "" }],
  ];

  const fieldOf = (def: FieldDef) => (
    <NumberField key={def.name} t={t} def={def} value={values[def.name]} error={error(def.name)} onChange={(value) => set(def.name, value)} />
  );

  return (
    <form action={formAction} noValidate className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
      <input type="hidden" name="lang" value={lang} />

      {sections.map((section) => (
        <fieldset key={section.key} className={card}>
          <legend className="sr-only">{t.sections[section.key].title}</legend>
          <div className="flex flex-col gap-1">
            <h2 className={heading}>{t.sections[section.key].title}</h2>
            <p className="text-sm text-muted">{t.sections[section.key].text}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">{section.fields.map(fieldOf)}</div>
          {section.key === "prices" && margin !== null && Number.isFinite(margin) ? (
            <p className="text-sm font-bold">{interpolate(t.margin, { pct: formatPercent(margin) })}</p>
          ) : null}
          {section.key === "calculation" ? (
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[15px] font-bold">{t.crewLegend}</h3>
                <p className="text-[13px] text-muted">{t.hints.crew}</p>
              </div>
              {crew.map((row, index) => (
                <div key={index} className="grid gap-4 sm:grid-cols-2">
                  {row.map(fieldOf)}
                </div>
              ))}
            </div>
          ) : null}
        </fieldset>
      ))}

      <fieldset className={card}>
        <legend className="sr-only">{t.sections.quote.title}</legend>
        <div className="flex flex-col gap-1">
          <h2 className={heading}>{t.sections.quote.title}</h2>
          <p className="text-sm text-muted">{t.sections.quote.text}</p>
        </div>
        <ChoiceGroup
          name="quotePresentation"
          legend={t.presentation.legend}
          variant="segment"
          options={QUOTE_PRESENTATIONS.map((value) => ({ value, label: t.presentation[value] }))}
          value={values.quotePresentation as (typeof QUOTE_PRESENTATIONS)[number]}
          onChange={(value) => set("quotePresentation", value)}
          error={errors.quotePresentation ? t.errors[errors.quotePresentation] : undefined}
        />
        <p className="text-[13px] text-muted">
          {values.quotePresentation === "hourly" ? t.presentation.hourlyHint : t.presentation.fixedHint}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">{fieldOf({ name: "quoteValidityDays", unit: u.days })}</div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <span role="status" className={`text-sm font-bold ${state.status === "error" ? "text-danger-foreground" : "text-success-foreground"}`}>
          {state.status === "saved"
            ? interpolate(t.saved, { version: state.version })
            : state.status === "error"
              ? errors.form
                ? t.errors[errors.form]
                : t.errors.review
              : ""}
        </span>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? t.saving : t.save}
        </button>
      </div>
    </form>
  );
}
