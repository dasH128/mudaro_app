import type { Locale } from "@/app/i18n/config";
import { pluralize } from "@/app/i18n/interpolate";
import type { ErrorCode, FieldErrors, FormValues } from "@/features/orders/application/schemas/new-order";
import { INVENTORY_MODES, LINK_VALIDITY_DAYS, type InventoryMode } from "@/features/orders/domain/types";
import type { NewOrderText } from "../orders-text";
import type { SetValue } from "./form-types";
import { SectionHeading } from "./section-heading";

type Props = {
  lang: Locale;
  t: NewOrderText;
  values: FormValues;
  errors: FieldErrors;
  set: SetValue;
};

const RECOMMENDED: InventoryMode = "link";

export function InventorySection({ lang, t, values, errors, set }: Props) {
  const i = t.inventory;
  const error = (code: ErrorCode | undefined) => (code ? t.errors[code] : undefined);

  return (
    <fieldset className="flex min-w-0 flex-col gap-4.5 rounded-2xl border border-line bg-surface p-6">
      <legend className="sr-only">{i.title}</legend>
      <SectionHeading step={3}>{i.title}</SectionHeading>

      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {INVENTORY_MODES.map((mode) => {
          const checked = values.inventoryMode === mode;
          return (
            <label
              key={mode}
              className={`flex cursor-pointer flex-col items-start gap-2 rounded-[14px] p-4.5 text-left has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                checked ? "border-2 border-foreground bg-surface" : "border border-status-off-border bg-surface-soft"
              }`}
            >
              <input
                type="radio"
                name="inventoryMode"
                value={mode}
                checked={checked}
                onChange={() => set("inventoryMode", mode)}
                className="sr-only"
              />
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-base font-bold">{i.modes[mode].title}</span>
                <span
                  aria-hidden="true"
                  className={`grid size-5 flex-none place-items-center rounded-full border-2 ${checked ? "border-foreground" : "border-field-border"}`}
                >
                  {checked ? <span className="size-2.5 rounded-full bg-foreground" /> : null}
                </span>
              </span>
              <span className="text-sm leading-[1.45] text-muted">{i.modes[mode].text}</span>
              {mode === RECOMMENDED ? (
                <span className="rounded-full bg-background px-2 py-0.75 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                  {i.modes.link.recommended}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      {errors.inventoryMode ? (
        <span role="alert" className="text-[13px] font-medium text-danger-foreground">
          {error(errors.inventoryMode)}
        </span>
      ) : null}

      {values.inventoryMode === "link" ? (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 text-sm">
          <label htmlFor="linkValidityDays" className="font-bold">
            {i.validity}
          </label>
          <select
            id="linkValidityDays"
            name="linkValidityDays"
            value={values.linkValidityDays}
            onChange={(event) => set("linkValidityDays", event.target.value)}
            aria-invalid={errors.linkValidityDays ? true : undefined}
            className="h-10 cursor-pointer rounded-[10px] border border-field-border bg-surface px-3 text-sm font-bold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {LINK_VALIDITY_DAYS.map((days) => (
              <option key={days} value={days}>
                {pluralize(lang, days, i.validityDays)}
              </option>
            ))}
          </select>
          <span className="text-muted">{i.validityNote}</span>
        </div>
      ) : null}
    </fieldset>
  );
}
