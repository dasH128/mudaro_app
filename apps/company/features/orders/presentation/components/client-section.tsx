import { useState } from "react";

import { Icon } from "@/app/components/app-icon";
import { ChoiceGroup } from "@/app/components/form/choice-group";
import { Field, describedBy, inputClass } from "@/app/components/form/field";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDayMonth } from "@/app/lib/format";
import type { ErrorCode, FieldErrors, FormValues } from "@/features/orders/application/schemas/new-order";
import { initials } from "@/features/orders/domain/client-name";
import { CLIENT_TYPES, type ClientSuggestion } from "@/features/orders/domain/types";
import type { NewOrderText } from "../orders-text";
import type { SetValue } from "./form-types";
import { SectionHeading } from "./section-heading";

type Props = {
  lang: Locale;
  t: NewOrderText;
  values: FormValues;
  errors: FieldErrors;
  set: SetValue;
  onPhoneChange: (value: string) => void;
  /** Cliente existente propuesto para este teléfono (RF-14). `null` si no hay o ya se descartó. */
  suggestion: ClientSuggestion | null;
  onUseSuggestion: () => void;
  onDismissSuggestion: () => void;
};

const secondaryButton =
  "h-9 rounded-[10px] border border-field-border bg-surface px-3.5 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const linkButton =
  "flex h-9 items-center gap-1.5 text-sm font-bold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function ClientSection({ lang, t, values, errors, set, onPhoneChange, suggestion, onUseSuggestion, onDismissSuggestion }: Props) {
  const c = t.client;
  const [showTaxId, setShowTaxId] = useState(values.taxId !== "");
  const error = (code: ErrorCode | undefined) => (code ? t.errors[code] : undefined);

  return (
    <fieldset className="flex min-w-0 flex-col gap-4.5 rounded-[22px] border border-line bg-surface p-6">
      <legend className="sr-only">{c.title}</legend>
      <SectionHeading step={1}>{c.title}</SectionHeading>

      <Field id="phone" label={c.phone} required hint={c.phoneHint} error={error(errors.phone)}>
        <div className="flex h-12 max-w-90 items-center overflow-hidden rounded-xl border border-field-border bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary has-[[aria-invalid=true]]:border-danger-dot">
          <span className="grid h-full place-items-center border-r border-line bg-surface-head px-3.5 text-[15px] font-bold text-muted">
            +351
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={c.phonePlaceholder}
            value={values.phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            aria-required="true"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("phone", { hint: true, error: Boolean(errors.phone) })}
            className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-base text-foreground outline-none placeholder:text-field-placeholder"
          />
        </div>
      </Field>

      {suggestion ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-status-off-border bg-surface-head px-4 py-3.5"
        >
          <span
            aria-hidden="true"
            className="grid size-10 flex-none place-items-center rounded-full bg-foreground text-sm font-bold text-background"
          >
            {initials(suggestion.name)}
          </span>
          <span className="flex min-w-55 flex-1 flex-col gap-0.5 text-sm">
            <strong>{interpolate(c.suggestion.title, { name: suggestion.name })}</strong>
            <span className="text-muted">
              {suggestion.lastOrder
                ? pluralize(lang, suggestion.orderCount, c.suggestion.summary, {
                    type: c.types[suggestion.type],
                    id: suggestion.lastOrder.id,
                    date: formatDayMonth(suggestion.lastOrder.completedOn),
                  })
                : interpolate(c.suggestion.noOrders, { type: c.types[suggestion.type] })}
            </span>
          </span>
          <span className="flex flex-wrap gap-2">
            <button type="button" onClick={onDismissSuggestion} className={`${linkButton} px-3`}>
              {c.suggestion.dismiss}
            </button>
            <button type="button" onClick={onUseSuggestion} className={secondaryButton}>
              {c.suggestion.use}
            </button>
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <Field id="name" label={c.name} required error={error(errors.name)}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            placeholder={c.namePlaceholder}
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name", { error: Boolean(errors.name) })}
            className={inputClass}
          />
          {values.clientId ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success-foreground">
              <Icon name="check" size={14} strokeWidth={2.5} />
              {c.linked}
            </span>
          ) : null}
        </Field>
        <ChoiceGroup
          name="clientType"
          legend={c.type}
          variant="segment"
          options={CLIENT_TYPES.map((value) => ({ value, label: c.types[value] }))}
          value={values.clientType}
          onChange={(value) => set("clientType", value)}
          error={error(errors.clientType)}
        />
      </div>
      <input type="hidden" name="clientId" value={values.clientId} />

      <Field
        id="email"
        label={
          <>
            {c.email} <span className="font-normal text-muted">{c.optional}</span>
          </>
        }
        hint={c.emailHint}
        error={error(errors.email)}
      >
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={c.emailPlaceholder}
          value={values.email}
          onChange={(event) => set("email", event.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email", { hint: true, error: Boolean(errors.email) })}
          className={inputClass}
        />
      </Field>

      {showTaxId ? (
        <Field
          id="taxId"
          label={
            <>
              {c.taxId} <span className="font-normal text-muted">{c.optional}</span>
            </>
          }
          hint={c.taxIdHint}
          error={error(errors.taxId)}
        >
          <div className="flex gap-2">
            <input
              id="taxId"
              name="taxId"
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              value={values.taxId}
              onChange={(event) => set("taxId", event.target.value)}
              aria-invalid={errors.taxId ? true : undefined}
              aria-describedby={describedBy("taxId", { hint: true, error: Boolean(errors.taxId) })}
              className={`${inputClass} max-w-60`}
            />
            <button
              type="button"
              aria-label={c.removeTaxId}
              onClick={() => {
                set("taxId", "");
                setShowTaxId(false);
              }}
              className="grid size-12 flex-none place-items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </Field>
      ) : (
        <button type="button" onClick={() => setShowTaxId(true)} className={`${linkButton} self-start`}>
          <Icon name="plus" size={16} strokeWidth={2.2} />
          {c.addTaxId}
        </button>
      )}
    </fieldset>
  );
}
