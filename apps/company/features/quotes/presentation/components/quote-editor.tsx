"use client";

import { DateField } from "@mudaro/ui";
import { useMemo, useState, useTransition } from "react";

import { calculateQuote, totalsOf, type CalcAlert, type CalcResult } from "@mudaro/quotes";

import { Icon } from "@/app/components/app-icon";
import { ChoiceGroup } from "@/app/components/form/choice-group";
import { Field, describedBy, inputClass } from "@/app/components/form/field";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatCompact, formatDecimal, formatEuro, formatPercent, formatVolume } from "@/app/lib/format";
import { parseDecimal } from "@/features/fleet/domain/new-vehicle";
import type { ExtraType } from "@/features/inventory/domain/types";
import { QUOTE_PRESENTATIONS, type QuotePresentation } from "@/features/pricing/domain/types";
import { saveQuoteAction, sendQuoteAction } from "../../application/actions/quote";
import {
  extraLineOf,
  initialLines,
  lineTotalCents,
  newLineKey,
  refreshBaseLines,
  type BaseLineLabels,
  type EditorLine,
  type QuoteError,
} from "../../domain/editor";
import type { QuoteEditorData } from "../../domain/editor-data";
import type { QuotesText } from "../quotes-text";

type EditorText = QuotesText["editor"];

type Props = {
  lang: Locale;
  t: EditorText;
  data: QuoteEditorData;
  /** Tipos de extra del catálogo de Mudaro, con el nombre en el idioma de la interfaz. */
  extraTypes: readonly ExtraType[];
  /** Validez por defecto (hoy + días de la tarifa), dd/mm/aaaa. */
  defaultValidUntil: string;
};

const card = "flex min-w-0 flex-col gap-4 rounded-[22px] border border-line bg-surface p-6";
const heading = "font-display text-[22px] font-extrabold";
const pill =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-field-border bg-surface px-3.5 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60";
const smallInput =
  "h-10 w-full min-w-0 rounded-lg border border-field-border bg-surface px-2.5 text-[15px] text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Texto de un campo numérico → número, o `null` si está vacío o no es un número. */
function numberOf(text: string): number | null {
  const value = parseDecimal(text.trim());
  return Number.isFinite(value) ? value : null;
}

const toInput = (value: number | null) => (value === null ? "" : String(value).replace(".", ","));
const isoToPt = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : iso);

function alertText(t: EditorText["alerts"], alert: CalcAlert): string {
  switch (alert.kind) {
    case "no-lift":
      return interpolate(t["no-lift"], { floors: alert.floors });
    case "far-parking":
      return interpolate(t["far-parking"], { meters: alert.meters });
    case "special-items":
      return interpolate(t["special-items"], { fragile: alert.fragile, dismantle: alert.dismantle, extraCrew: alert.extraCrew });
    case "unmeasured":
      return interpolate(t.unmeasured, { count: alert.count });
    case "extra-trips":
      return interpolate(t["extra-trips"], { trips: alert.trips });
    case "minimum-applied":
      return interpolate(t["minimum-applied"], { amount: formatEuro(alert.minimumCents) });
    case "no-vehicles":
    case "no-km":
    case "missing-vehicle-cost":
      return t[alert.kind];
  }
}

// RF-35 a RF-42: el cálculo propone, la empresa ajusta (RF-37), guarda y envía. Lo calculado se rehace en el navegador
// con @mudaro/quotes al cambiar km, operários u horas; la base vuelve a calcular el total de cada línea al guardar.
export function QuoteEditor({ lang, t, data, extraTypes, defaultValidUntil }: Props) {
  const labels: BaseLineLabels = t.base;
  const draft = data.draft;

  const [pricingMode, setPricingMode] = useState<QuotePresentation>(draft?.pricingMode ?? data.tariff.quotePresentation);
  const [kmText, setKmText] = useState(toInput(draft?.km ?? null));
  const [operatorsText, setOperatorsText] = useState(toInput(draft?.operators ?? null));
  const [hoursText, setHoursText] = useState(toInput(draft?.hours ?? null));
  const [validUntil, setValidUntil] = useState(draft?.validUntil ? isoToPt(draft.validUntil) : defaultValidUntil);
  const [conditions, setConditions] = useState(draft?.conditions ?? "");

  const calcFor = (km: string, operators: string, hours: string): CalcResult =>
    calculateQuote(
      { ...data.calcBase, km: numberOf(km) },
      { operators: numberOf(operators) ?? undefined, totalHours: numberOf(hours) ?? undefined },
    );

  const [lines, setLines] = useState<EditorLine[]>(() =>
    draft
      ? [...draft.lines]
      : initialLines(
          calcFor(kmText, operatorsText, hoursText),
          labels,
          data.extras,
          data.markedExtras.map((extra) => extra.typeId),
        ),
  );
  const calc = useMemo(() => calcFor(kmText, operatorsText, hoursText), [kmText, operatorsText, hoursText]); // eslint-disable-line react-hooks/exhaustive-deps

  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "saved" } | { kind: "error"; error: QuoteError } | null>(null);
  // Enviar no se deshace (RF-42): pide confirmación
  const [confirmingSend, setConfirmingSend] = useState(false);

  /** km, operários u horas cambiados: las líneas base sin tocar a mano se rehacen. */
  const recalc = (km: string, operators: string, hours: string) => {
    setLines((current) => refreshBaseLines(current, calcFor(km, operators, hours), labels));
    setMessage(null);
  };

  const updateLine = (key: string, patch: Partial<EditorLine>) => {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch, edited: line.edited || line.kind === "base" } : line)));
    setMessage(null);
  };

  const included = totalsOf(lines.map((line) => ({ totalCents: lineTotalCents(line), optional: line.optional, selected: false })), data.tariff.vatPct);
  const everything = totalsOf(lines.map((line) => ({ totalCents: lineTotalCents(line), optional: line.optional, selected: true })), data.tariff.vatPct);
  const hasOptional = lines.some((line) => line.optional);
  const margin = included.subtotalCents > 0 ? (included.subtotalCents - calc.costCents) / included.subtotalCents : null;

  const activeExtras = data.extras.filter((extra) => extra.active);
  const typeName = (id: string) => extraTypes.find((type) => type.id === id)?.name ?? "";
  const asked = data.markedExtras.map((extra) => (extra.note ? `${typeName(extra.typeId)} (${extra.note})` : typeName(extra.typeId))).filter(Boolean);

  const payload = () => ({
    lang,
    orderId: data.order.id,
    pricingMode,
    km: numberOf(kmText),
    operators: numberOf(operatorsText) === null ? null : Math.round(numberOf(operatorsText) as number),
    hours: numberOf(hoursText),
    validUntil: validUntil.trim(),
    conditions,
    summary: {
      volumeM3: calc.adjustedVolumeM3,
      vehicleCount: calc.vehicles.length,
      operatorCount: calc.operators,
      estimatedHours: calc.totalHours,
      hourlyRateCents: calc.hourlyRateCents,
      estimatedCostCents: calc.costCents,
      suggestedPriceCents: calc.priceCents,
      suggested: { operators: calc.suggestedOperators, hours: calc.suggestedHours },
      alerts: calc.alerts.map((alert) => alert.kind),
    },
    lines: lines.map(({ kind, code, companyExtraId, description, quantity, unit, unitPriceCents, optional, edited }) => ({
      kind,
      code,
      companyExtraId,
      description,
      quantity,
      unit,
      unitPriceCents,
      optional,
      edited,
    })),
  });

  const run = (action: typeof saveQuoteAction) =>
    startTransition(async () => {
      setMessage(null);
      // Si se envía, la acción redirige al pedido y no vuelve
      const result = await action(payload());
      setMessage(result.ok ? { kind: "saved" } : { kind: "error", error: result.error });
    });

  const c = t.calc;

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-5">
        <section aria-labelledby="calc-title" className={card}>
          <div className="flex flex-col gap-1">
            <h2 id="calc-title" className={heading}>
              {c.title}
            </h2>
            <p className="text-sm text-muted">{c.text}</p>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5 rounded-2xl bg-surface-soft px-4 py-3">
              <dt className="text-[13px] text-muted">{c.volume}</dt>
              <dd className="text-lg font-bold">
                {formatVolume(calc.adjustedVolumeM3)}{" "}
                <span className="text-[13px] font-normal text-muted">{interpolate(c.declared, { value: formatVolume(calc.declaredVolumeM3) })}</span>
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 rounded-2xl bg-surface-soft px-4 py-3">
              <dt className="text-[13px] text-muted">{c.vehicles}</dt>
              <dd className="text-lg font-bold">
                {calc.vehicles.length > 0 ? calc.vehicles.map((v) => v.name).join(" + ") : c.noVehicles}{" "}
                {calc.vehicles.length > 0 ? <span className="text-[13px] font-normal text-muted">· {pluralize(lang, calc.trips, c.trips)}</span> : null}
              </dd>
            </div>
          </dl>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="quote-km" label={c.km} hint={c.kmHint}>
              <input
                id="quote-km"
                inputMode="decimal"
                value={kmText}
                aria-describedby={describedBy("quote-km", { hint: true })}
                onChange={(event) => {
                  setKmText(event.target.value);
                  recalc(event.target.value, operatorsText, hoursText);
                }}
                className={inputClass}
              />
            </Field>
            <Field id="quote-operators" label={c.operators} hint={interpolate(c.suggested, { value: calc.suggestedOperators })}>
              <input
                id="quote-operators"
                inputMode="numeric"
                value={operatorsText}
                placeholder={String(calc.suggestedOperators)}
                aria-describedby={describedBy("quote-operators", { hint: true })}
                onChange={(event) => {
                  setOperatorsText(event.target.value);
                  recalc(kmText, event.target.value, hoursText);
                }}
                className={inputClass}
              />
            </Field>
            <Field id="quote-hours" label={c.hours} hint={interpolate(c.suggested, { value: formatDecimal(calc.suggestedHours) })}>
              <input
                id="quote-hours"
                inputMode="decimal"
                value={hoursText}
                placeholder={formatDecimal(calc.totalHours)}
                aria-describedby={describedBy("quote-hours", { hint: true })}
                onChange={(event) => {
                  setHoursText(event.target.value);
                  recalc(kmText, operatorsText, event.target.value);
                }}
                className={inputClass}
              />
            </Field>
          </div>
          {operatorsText !== "" || hoursText !== "" || lines.some((line) => line.kind === "base" && line.edited) ? (
            <button
              type="button"
              onClick={() => {
                setOperatorsText("");
                setHoursText("");
                setLines((current) =>
                  refreshBaseLines(
                    current.map((line) => (line.kind === "base" ? { ...line, edited: false } : line)),
                    calcFor(kmText, "", ""),
                    labels,
                  ),
                );
              }}
              className={`${pill} self-start`}
            >
              {c.reset}
            </button>
          ) : null}

          {calc.alerts.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-warn-surface px-4 py-3">
              <h3 className="text-[15px] font-bold">{t.alerts.title}</h3>
              <ul className="flex flex-col gap-1 text-sm">
                {calc.alerts.map((alert) => (
                  <li key={alert.kind} className="flex items-start gap-2">
                    <Icon name="alert" size={16} className="mt-0.5 flex-none" />
                    {alertText(t.alerts, alert)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="lines-title" className={card}>
          <div className="flex flex-col gap-1">
            <h2 id="lines-title" className={heading}>
              {t.lines.title}
            </h2>
            {asked.length > 0 ? <p className="text-sm">{interpolate(t.lines.clientAsked, { list: asked.join(", ") })}</p> : null}
            <p className="text-[13px] text-muted">{t.lines.optionalHint}</p>
          </div>

          <ul className="flex flex-col gap-3">
            {lines.map((line) => (
              <LineRow
                key={line.key}
                t={t.lines}
                line={line}
                onChange={(patch) => updateLine(line.key, patch)}
                onRemove={line.kind === "base" ? null : () => setLines((current) => current.filter((l) => l.key !== line.key))}
              />
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeExtras.length > 0 ? (
              <label className="flex items-center gap-2">
                <span className="sr-only">{t.lines.addExtra}</span>
                <select
                  value=""
                  onChange={(event) => {
                    const extra = activeExtras.find((candidate) => candidate.id === event.target.value);
                    if (extra) setLines((current) => [...current, extraLineOf(extra, calc, false)]);
                  }}
                  className={`${smallInput} h-9 w-auto rounded-full pr-8 text-[13px] font-bold`}
                >
                  <option value="">{t.lines.addExtra}…</option>
                  {activeExtras.map((extra) => (
                    <option key={extra.id} value={extra.id}>
                      {extra.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-[13px] text-muted">{t.lines.noExtras}</p>
            )}
            <button
              type="button"
              onClick={() =>
                setLines((current) => [
                  ...current,
                  { key: newLineKey(), kind: "manual", code: null, companyExtraId: null, description: t.lines.newLine, quantity: 1, unit: null, unitPriceCents: 0, optional: false, edited: true },
                ])
              }
              className={pill}
            >
              <Icon name="plus" size={14} strokeWidth={2.4} />
              {t.lines.addManual}
            </button>
          </div>
        </section>

        <section aria-labelledby="presentation-title" className={card}>
          <h2 id="presentation-title" className={heading}>
            {t.presentation.title}
          </h2>
          <ChoiceGroup
            name="pricingMode"
            legend={t.presentation.legend}
            variant="segment"
            options={QUOTE_PRESENTATIONS.map((value) => ({ value, label: t.presentation[value] }))}
            value={pricingMode}
            onChange={setPricingMode}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="quote-valid" label={t.presentation.validUntil} hint={t.presentation.validHint}>
              <DateField
                id="quote-valid"
                defaultValue={validUntil}
                aria-describedby={describedBy("quote-valid", { hint: true })}
                onChange={setValidUntil}
                className={inputClass}
              />
            </Field>
          </div>
          <Field id="quote-conditions" label={t.presentation.conditions}>
            <textarea
              id="quote-conditions"
              rows={3}
              maxLength={5000}
              value={conditions}
              placeholder={t.presentation.conditionsPlaceholder}
              onChange={(event) => setConditions(event.target.value)}
              className="resize-y rounded-xl border border-field-border bg-surface px-3.5 py-3 text-base text-foreground outline-none placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </Field>
        </section>
      </div>

      <aside aria-labelledby="summary-title" className="sticky top-6 flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-[22px] bg-sidebar p-6 text-white">
        <h2 id="summary-title" className="text-sm font-bold text-on-ink">
          {t.summary.title}
        </h2>
        <dl className="flex flex-col gap-1.5 text-[15px]">
          <div className="flex justify-between gap-3">
            <dt className="text-on-ink">{t.summary.subtotal}</dt>
            <dd>{formatEuro(included.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-on-ink">{interpolate(t.summary.vat, { pct: `${formatCompact(data.tariff.vatPct)} %` })}</dt>
            <dd>{formatEuro(included.vatCents)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-white/15 pt-2">
            <dt className="font-bold">{t.summary.total}</dt>
            <dd className="font-display text-[30px] leading-none font-extrabold">{formatEuro(included.totalCents)}</dd>
          </div>
        </dl>
        {hasOptional ? <p className="text-[13px] text-on-ink">{interpolate(t.summary.withOptional, { amount: formatEuro(everything.totalCents) })}</p> : null}
        {pricingMode === "hourly" ? (
          <p className="text-[13px] text-on-ink">{interpolate(t.summary.hourlyRate, { amount: formatEuro(calc.hourlyRateCents), count: calc.operators })}</p>
        ) : null}
        <dl className="flex flex-col gap-1.5 rounded-xl bg-white/[0.08] p-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-on-ink">{t.summary.cost}</dt>
            <dd>{formatEuro(calc.costCents)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-on-ink">{t.summary.margin}</dt>
            <dd className="font-bold">{margin === null ? "—" : formatPercent(margin)}</dd>
          </div>
          <p className="text-xs text-on-ink">{t.summary.adminOnly}</p>
        </dl>

        <div className="flex flex-col gap-2">
          {confirmingSend ? (
            <div role="alertdialog" aria-labelledby="send-confirm" className="flex flex-col gap-2.5 rounded-xl bg-white/[0.08] p-3">
              <p id="send-confirm" className="text-sm font-bold">
                {t.sendNote}
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(sendQuoteAction)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? t.sending : t.sendConfirm}
              </button>
              <button type="button" disabled={pending} onClick={() => setConfirmingSend(false)} className="h-9 text-sm font-bold underline">
                {t.cancel}
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(saveQuoteAction)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/30 px-5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? t.saving : t.save}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmingSend(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70"
              >
                {t.send}
              </button>
            </>
          )}
          <span role={message?.kind === "error" ? "alert" : "status"} className="text-sm font-bold">
            {message?.kind === "saved" ? t.saved : message?.kind === "error" ? t.errors[message.error] : ""}
          </span>
        </div>
      </aside>
    </div>
  );
}

/** Una línea del orçamento. Cantidad y precio se escriben con coma decimal y se guardan al salir del campo. */
function LineRow({
  t,
  line,
  onChange,
  onRemove,
}: {
  t: EditorText["lines"];
  line: EditorLine;
  onChange: (patch: Partial<EditorLine>) => void;
  onRemove: (() => void) | null;
}) {
  const [quantity, setQuantity] = useState(String(line.quantity).replace(".", ","));
  const [price, setPrice] = useState((line.unitPriceCents / 100).toFixed(2).replace(".", ","));
  const [lastLine, setLastLine] = useState(line);

  // Si el cálculo rehace la línea (km, operários u horas), los campos muestran los valores nuevos
  if (lastLine !== line) {
    setLastLine(line);
    setQuantity(String(line.quantity).replace(".", ","));
    setPrice((line.unitPriceCents / 100).toFixed(2).replace(".", ","));
  }

  const id = `line-${line.key}`;
  return (
    <li className={`grid gap-2.5 rounded-2xl border px-3.5 py-3 sm:grid-cols-[minmax(0,1fr)_88px_110px_110px_auto] sm:items-end ${line.optional ? "border-dashed border-accent bg-surface-soft" : "border-line-soft"}`}>
      <label className="flex min-w-0 flex-col gap-1">
        <span className="text-xs text-muted">
          {t.description}
          {line.edited && line.kind === "base" ? <span className="text-muted"> · {t.edited}</span> : null}
        </span>
        <input id={`${id}-description`} value={line.description} maxLength={200} onChange={(event) => onChange({ description: event.target.value })} className={smallInput} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">
          {t.quantity}
          {line.unit ? ` (${line.unit})` : ""}
        </span>
        <input
          inputMode="decimal"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          onBlur={() => {
            const value = numberOf(quantity);
            if (value !== null && value > 0) onChange({ quantity: value });
            else setQuantity(String(line.quantity).replace(".", ","));
          }}
          className={smallInput}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">{t.price} (€)</span>
        <input
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          onBlur={() => {
            const value = numberOf(price);
            if (value !== null && value >= 0) onChange({ unitPriceCents: Math.round(value * 100) });
            else setPrice((line.unitPriceCents / 100).toFixed(2).replace(".", ","));
          }}
          className={smallInput}
        />
      </label>
      <span className="flex flex-col gap-1">
        <span className="text-xs text-muted">{t.total}</span>
        <strong className="flex h-10 items-center text-[15px]">{formatEuro(lineTotalCents(line))}</strong>
      </span>
      <span className="flex items-center gap-2">
        {line.kind === "extra" ? (
          <button type="button" aria-pressed={line.optional} onClick={() => onChange({ optional: !line.optional })} className={pill}>
            {line.optional ? t.optional : t.included}
          </button>
        ) : null}
        {onRemove ? (
          <button type="button" onClick={onRemove} aria-label={interpolate(t.remove, { name: line.description })} className={`${pill} w-9 px-0`}>
            <Icon name="close" size={14} strokeWidth={2.4} />
          </button>
        ) : null}
      </span>
    </li>
  );
}
