"use client";

import { useActionState, useEffect, useState } from "react";

import { Field, describedBy, inputClass } from "@/app/components/form/field";
import type { Locale } from "@/app/i18n/config";
import { formatEuro } from "@/app/lib/format";
import type { ExtraType } from "@/features/inventory/domain/types";
import { saveExtraAction } from "../../application/actions/pricing";
import type { ExtraFormState } from "../../application/schemas/extra";
import { EXTRA_NAME_MAX, PRICE_MODES, type CompanyExtra, type PriceMode } from "../../domain/types";
import { centsToInput, type PricingText } from "../pricing-text";

type Props = {
  lang: Locale;
  t: PricingText;
  extras: readonly CompanyExtra[];
  /** Tipos del catálogo de Mudaro, con el nombre en el idioma de la interfaz. */
  types: readonly ExtraType[];
};

const IDLE: ExtraFormState = { status: "idle" };
const pill =
  "inline-flex h-9 items-center justify-center rounded-full border border-field-border px-3.5 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60";
const selectClass = `${inputClass} appearance-none pr-9`;

type Draft = { id: string; catalogExtraId: string; name: string; priceMode: PriceMode; price: string; active: boolean };

const EMPTY: Draft = { id: "", catalogExtraId: "", name: "", priceMode: "fixed", price: "", active: true };

function draftOf(extra: CompanyExtra): Draft {
  return {
    id: extra.id,
    catalogExtraId: extra.catalogExtraId ?? "",
    name: extra.name,
    priceMode: extra.priceMode,
    price: centsToInput(extra.priceCents),
    active: extra.active,
  };
}

// RF-07: servicios extra de la empresa. Cada uno cuelga de un tipo del catálogo de Mudaro (se sugiere en el orçamento
// cuando el cliente marca ese tipo) o es propio. Activar o desactivar guarda el servicio con el estado cambiado.
export function ExtrasPanel({ lang, t, extras, types }: Props) {
  const e = t.extras;
  const [editing, setEditing] = useState<Draft | null>(null);
  const typeName = (id: string | null) => (id ? (types.find((type) => type.id === id)?.name ?? "—") : e.ownType);

  return (
    <section aria-labelledby="extras-title" className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 self-start rounded-[22px] border border-line bg-surface p-6">
      <div className="flex flex-col items-start gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="extras-title" className="font-display text-[22px] font-extrabold">
            {e.title}
          </h2>
          <p className="text-sm text-muted">{e.text}</p>
        </div>
        {editing ? null : (
          <button type="button" onClick={() => setEditing(EMPTY)} className={`${pill} bg-foreground text-background`}>
            {e.add}
          </button>
        )}
      </div>

      {editing && editing.id === "" ? (
        <ExtraForm key="new" lang={lang} t={t} types={types} initial={editing} onDone={() => setEditing(null)} />
      ) : null}

      {extras.length === 0 && !editing ? <p className="text-sm text-muted">{e.empty}</p> : null}

      <ul className="flex flex-col gap-2.5">
        {extras.map((extra) =>
          editing?.id === extra.id ? (
            <li key={extra.id}>
              <ExtraForm lang={lang} t={t} types={types} initial={editing} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li
              key={extra.id}
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line-soft px-4 py-3 ${extra.active ? "bg-surface" : "bg-surface-soft"}`}
            >
              <span className="flex min-w-0 flex-[1_1_180px] flex-col gap-0.5">
                <strong className="text-[15px]">{extra.name}</strong>
                <span className="text-[13px] text-muted">
                  {typeName(extra.catalogExtraId)} · {e.priceModes[extra.priceMode]}
                </span>
              </span>
              <span className="text-[15px] font-bold">
                {formatEuro(extra.priceCents)}
                <span className="font-normal text-muted">{e.priceSuffix[extra.priceMode]}</span>
              </span>
              <span
                className={`inline-flex h-6.5 items-center rounded-full px-2.5 text-xs font-bold ${extra.active ? "bg-success-surface text-success-foreground" : "bg-line-soft text-muted"}`}
                title={extra.active ? undefined : e.inactiveHint}
              >
                {extra.active ? e.active : e.inactive}
              </span>
              <span className="flex gap-2">
                <ToggleActive lang={lang} t={t} extra={extra} />
                <button type="button" onClick={() => setEditing(draftOf(extra))} disabled={editing !== null} className={`${pill} bg-surface`}>
                  {e.edit}
                </button>
              </span>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

/** Alta o edición de un servicio. Con el servidor de acuerdo, cierra el formulario (la página ya trae la lista nueva). */
function ExtraForm({
  lang,
  t,
  types,
  initial,
  onDone,
}: {
  lang: Locale;
  t: PricingText;
  types: readonly ExtraType[];
  initial: Draft;
  onDone: () => void;
}) {
  const e = t.extras;
  const [state, formAction, pending] = useActionState(saveExtraAction, IDLE);
  const [draft, setDraft] = useState<Draft>(initial);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const error = (field: keyof typeof errors) => (errors[field] ? e.errors[errors[field]] : undefined);
  const prefix = `extra-${initial.id || "new"}`;

  useEffect(() => {
    if (state.status === "saved") onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3.5 rounded-2xl border-2 border-foreground p-4">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="id" value={draft.id} />
      <input type="hidden" name="active" value={String(draft.active)} />

      <Field id={`${prefix}-name`} label={e.name} error={error("name")}>
        <input
          id={`${prefix}-name`}
          name="name"
          value={draft.name}
          maxLength={EXTRA_NAME_MAX}
          placeholder={e.namePlaceholder}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy(`${prefix}-name`, { error: Boolean(errors.name) })}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          className={inputClass}
        />
      </Field>

      <Field id={`${prefix}-type`} label={e.type} hint={draft.catalogExtraId === "" ? e.ownHint : undefined} error={error("catalogExtraId")}>
        <select
          id={`${prefix}-type`}
          name="catalogExtraId"
          value={draft.catalogExtraId}
          aria-describedby={describedBy(`${prefix}-type`, { hint: draft.catalogExtraId === "", error: Boolean(errors.catalogExtraId) })}
          onChange={(event) => setDraft({ ...draft, catalogExtraId: event.target.value })}
          className={selectClass}
        >
          <option value="">{e.ownType}</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field id={`${prefix}-mode`} label={e.priceMode} error={error("priceMode")}>
          <select
            id={`${prefix}-mode`}
            name="priceMode"
            value={draft.priceMode}
            onChange={(event) => setDraft({ ...draft, priceMode: event.target.value as PriceMode })}
            className={selectClass}
          >
            {PRICE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {e.priceModes[mode]}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${prefix}-price`} label={e.price} error={error("price")}>
          <span
            className={`flex h-12 items-center overflow-hidden rounded-xl border bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${errors.price ? "border-danger-dot" : "border-field-border"}`}
          >
            <input
              id={`${prefix}-price`}
              name="price"
              inputMode="decimal"
              autoComplete="off"
              value={draft.price}
              placeholder="0,00"
              aria-invalid={errors.price ? true : undefined}
              aria-describedby={describedBy(`${prefix}-price`, { error: Boolean(errors.price) })}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
              className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-base font-bold text-foreground outline-none placeholder:font-normal placeholder:text-field-placeholder"
            />
            <span aria-hidden="true" className="px-3.5 text-sm text-muted">
              €{e.priceSuffix[draft.priceMode]}
            </span>
          </span>
        </Field>
      </div>

      {errors.form ? (
        <p role="alert" className="text-[13px] font-bold text-danger-foreground">
          {e.errors[errors.form]}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onDone} className={`${pill} bg-surface`}>
          {e.cancel}
        </button>
        <button type="submit" disabled={pending} className={`${pill} border-transparent bg-primary text-primary-foreground`}>
          {initial.id ? e.saveEdit : e.saveNew}
        </button>
      </div>
    </form>
  );
}

/** Activar o desactivar: guarda el servicio igual, con el estado cambiado. */
function ToggleActive({ lang, t, extra }: { lang: Locale; t: PricingText; extra: CompanyExtra }) {
  const [, formAction, pending] = useActionState(saveExtraAction, IDLE);
  return (
    <form action={formAction}>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="id" value={extra.id} />
      <input type="hidden" name="catalogExtraId" value={extra.catalogExtraId ?? ""} />
      <input type="hidden" name="name" value={extra.name} />
      <input type="hidden" name="priceMode" value={extra.priceMode} />
      <input type="hidden" name="price" value={centsToInput(extra.priceCents)} />
      <input type="hidden" name="active" value={String(!extra.active)} />
      <button type="submit" disabled={pending} className={`${pill} bg-surface`}>
        {extra.active ? t.extras.deactivate : t.extras.activate}
      </button>
    </form>
  );
}
