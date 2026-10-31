import { Icon } from "@/app/components/app-icon";
import { Field, describedBy, inputClass } from "@/app/components/form/field";
import { interpolate } from "@/app/i18n/interpolate";
import type { ErrorCode, FieldErrors, FormValues } from "../../application/schemas/new-vehicle";
import { normalizePlate } from "../../domain/plate";
import { LIMITS, presetOf } from "../../domain/new-vehicle";
import type { NewVehicleText } from "../new-vehicle-text";
import { suggestedValues } from "../new-vehicle-text";
import type { FleetSnapshot } from "../../domain/new-vehicle";

type SetValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;

type Props = {
  t: NewVehicleText;
  values: FormValues;
  errors: FieldErrors;
  set: SetValue;
};

const card = "flex min-w-0 scroll-mt-6 flex-col gap-3.5 rounded-[22px] border border-line bg-surface p-6";
const heading = "font-display text-[22px] font-extrabold";

/** Campo con unidad al final (m³, kg, €). El borde rojo y `aria-invalid` los lleva el contenedor. */
function UnitInput({
  id,
  value,
  onChange,
  unit,
  placeholder,
  invalid,
  describedby,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  unit: string;
  placeholder: string;
  invalid: boolean;
  describedby: string | undefined;
}) {
  return (
    <span
      className={`flex h-12 items-center overflow-hidden rounded-xl border bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${invalid ? "border-danger-dot" : "border-field-border"}`}
    >
      <input
        id={id}
        name={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedby}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-[17px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-field-placeholder"
      />
      <span aria-hidden className="px-3 text-sm text-muted">
        {unit}
      </span>
    </span>
  );
}

type IdentificationProps = Props & { fleet: FleetSnapshot };

/** Paso 2: matrícula y nombre corto. */
export function IdentificationSection({ t, values, errors, set, fleet }: IdentificationProps) {
  const i = t.identification;
  const error = (code: ErrorCode | undefined) => (code ? t.errors[code] : undefined);
  const plate = normalizePlate(values.plate);
  const taken = plate !== null && fleet.vehicles.some((v) => v.plate === plate);

  // Estado en directo de la matrícula, mientras el servidor no haya dicho nada
  const live: { text: string; tone: "ok" | "bad" | "muted" } =
    plate === null ? { text: i.plateFormat, tone: "muted" } : taken ? { text: i.plateTaken, tone: "bad" } : { text: i.plateFree, tone: "ok" };
  const plateError = error(errors.plate);

  return (
    <fieldset id="section-identification" className={card}>
      <legend className="sr-only">{i.title}</legend>
      <h2 className={heading}>{i.title}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Field
          id="plate"
          label={i.plate}
          required
          error={plateError}
          hint={
            !plateError ? (
              <span
                className={`flex items-center gap-1.5 font-bold ${live.tone === "ok" ? "text-success-foreground" : live.tone === "bad" ? "text-danger-foreground" : "font-normal text-muted"}`}
              >
                {live.tone === "ok" ? <Icon name="check" size={14} strokeWidth={2.6} /> : null}
                {live.text}
              </span>
            ) : undefined
          }
        >
          <input
            id="plate"
            name="plate"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={values.plate}
            placeholder="AA-00-AA"
            aria-invalid={plateError ? true : undefined}
            aria-describedby={describedBy("plate", { hint: !plateError, error: Boolean(plateError) })}
            onChange={(event) => set("plate", event.target.value)}
            className={`${inputClass} font-mono text-[17px] font-bold tracking-[0.04em] uppercase placeholder:font-normal`}
          />
        </Field>
        <Field
          id="name"
          label={
            <>
              {i.name} <span className="font-normal text-muted">{i.optional}</span>
            </>
          }
          hint={i.nameHint}
          error={error(errors.name)}
        >
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="off"
            value={values.name}
            maxLength={LIMITS.nameMax}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name", { hint: true, error: Boolean(errors.name) })}
            onChange={(event) => set("name", event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
    </fieldset>
  );
}

/** Paso 3: capacidad, carga máxima y coste por km, con los valores habituales del tipo como sugerencia. */
export function CapacitySection({ t, values, errors, set, fleet }: IdentificationProps) {
  const c = t.capacity;
  const error = (code: ErrorCode | undefined) => (code ? t.errors[code] : undefined);
  const hasPreset = presetOf(values.type) !== null;
  const suggested = suggestedValues(values.type, fleet, t);
  const tag = (field: "capacity" | "maxLoad" | "cost") =>
    hasPreset && values[field] === suggested[field] ? (
      <span className="self-start rounded-full bg-status-config-surface px-2 py-0.5 text-[11px] font-bold">{c.suggested}</span>
    ) : null;

  const fields = [
    { key: "capacity", label: c.capacity, unit: "m³", placeholder: "0", required: true },
    { key: "maxLoad", label: c.maxLoad, unit: "kg", placeholder: "0", required: false },
    { key: "cost", label: c.cost, unit: "€", placeholder: "0,00", required: true },
  ] as const;

  return (
    <fieldset id="section-capacity" className={card}>
      <legend className="sr-only">{c.title}</legend>
      <div className="flex flex-col gap-1">
        <h2 className={heading}>{c.title}</h2>
        <span className="text-sm text-muted">{c.subtitle}</span>
      </div>
      {hasPreset ? (
        <div className="flex gap-2.5 rounded-[14px] bg-surface-head px-3.5 py-3 text-[13px] leading-snug">
          <Icon name="info" size={18} className="flex-none" />
          <span>
            {interpolate(c.suggestion, { type: t.types[values.type].label.toLowerCase() })}
          </span>
        </div>
      ) : null}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        {fields.map(({ key, label, unit, placeholder, required }) => {
          const message = error(errors[key]);
          return (
            <Field key={key} id={key} label={label} required={required} error={message}>
              <UnitInput
                id={key}
                value={values[key]}
                onChange={(value) => set(key, value)}
                unit={unit}
                placeholder={placeholder}
                invalid={Boolean(message)}
                describedby={describedBy(key, { error: Boolean(message) })}
              />
              {tag(key)}
            </Field>
          );
        })}
      </div>
      <p className="flex gap-2 text-xs leading-snug text-muted">
        <Icon name="lock" size={14} strokeWidth={2.2} className="mt-px flex-none" />
        {c.privacy}
      </p>
    </fieldset>
  );
}

/** Paso 4: si el vehículo entra ya en propuestas y agenda. */
export function AvailabilitySection({ t, values, set }: Pick<Props, "t" | "values" | "set">) {
  const a = t.availability;
  const on = values.active === "true";

  return (
    <fieldset id="section-availability" className={card}>
      <legend className="sr-only">{a.title}</legend>
      <h2 className={heading}>{a.title}</h2>
      <input type="hidden" name="active" value={values.active} />
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set("active", on ? "false" : "true")}
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl bg-surface-soft px-4 py-3.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="flex flex-col gap-0.5">
          <strong>{a.label}</strong>
          <span className="text-[13px] text-muted">{on ? a.on : a.off}</span>
        </span>
        <span aria-hidden className={`relative h-7 w-11.5 flex-none rounded-full ${on ? "bg-foreground" : "bg-status-off-border"}`}>
          <span className={`absolute top-1 size-5 rounded-full ${on ? "left-5.5 bg-background" : "left-1 bg-surface"}`} />
        </span>
      </button>
    </fieldset>
  );
}

/** Lo que vendrá más adelante: documentos, fotos y mantenimiento. */
export function UpcomingSection({ t }: { t: NewVehicleText }) {
  const u = t.upcoming;
  const items = [u.documents, u.photos, u.maintenance];

  return (
    <section aria-labelledby="upcoming" className="flex flex-col gap-2.5 rounded-[22px] border-2 border-dashed border-accent bg-surface-soft px-6 py-5">
      <h2 id="upcoming" className="flex items-center gap-2 text-base font-bold">
        <span className="rounded-full bg-status-config-surface px-2 py-[3px] text-[10px] font-bold tracking-[0.06em] uppercase">{u.badge}</span>
        {u.title}
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5 text-[13px] leading-snug text-muted">
        {items.map((item) => (
          <li key={item.title}>
            <strong className="block text-foreground">{item.title}</strong>
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
