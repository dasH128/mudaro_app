import { Icon } from "@/app/components/app-icon";
import { ChoiceGroup } from "@/app/components/form/choice-group";
import { Field, describedBy, inputClass } from "@/app/components/form/field";
import { interpolate } from "@/app/i18n/interpolate";
import type { ErrorCode, FieldErrors, FormValues } from "@/features/orders/application/schemas/new-order";
import { FLEXIBILITIES, MAX_STOPS, SOURCES } from "@/features/orders/domain/types";
import type { NewOrderText } from "../orders-text";
import type { SetValue } from "./form-types";
import { SectionHeading } from "./section-heading";

type Props = {
  t: NewOrderText;
  values: FormValues;
  errors: FieldErrors;
  set: SetValue;
};

const linkButton =
  "flex h-9 items-center gap-1.5 self-start text-sm font-bold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60";

/** Un punto del recorrido: origen (A), paradas (1, 2…) y destino (B). */
function Marker({ kind, label }: { kind: "origin" | "stop" | "destination"; label: string }) {
  const style =
    kind === "origin"
      ? "bg-foreground text-background"
      : kind === "destination"
        ? "bg-primary text-primary-foreground"
        : "border-2 border-foreground bg-surface text-foreground";
  return (
    <span aria-hidden="true" className={`grid size-6 flex-none place-items-center rounded-full text-[11px] font-bold ${style}`}>
      {label}
    </span>
  );
}

export function MoveSection({ t, values, errors, set }: Props) {
  const m = t.move;
  const error = (code: ErrorCode | undefined) => (code ? t.errors[code] : undefined);
  const canAddStop = values.stops.length < MAX_STOPS;

  const setStop = (index: number, value: string) =>
    set(
      "stops",
      values.stops.map((stop, i) => (i === index ? value : stop)),
    );

  // Origen, paradas y destino en una sola lista para pintar la línea que los une
  const points = [
    { key: "origin", kind: "origin" as const, marker: "A" },
    ...values.stops.map((_, i) => ({ key: `stop-${i}`, kind: "stop" as const, marker: String(i + 1), index: i })),
    { key: "destination", kind: "destination" as const, marker: "B" },
  ];

  return (
    <fieldset className="flex min-w-0 flex-col gap-4.5 rounded-[22px] border border-line bg-surface p-6">
      <legend className="sr-only">{m.title}</legend>
      <SectionHeading step={2}>{m.title}</SectionHeading>

      <ol className="flex flex-col">
        {points.map((point, position) => {
          const isLast = position === points.length - 1;
          return (
            <li key={point.key} className="flex gap-3.5">
              <div aria-hidden="true" className="flex flex-col items-center pt-9.5">
                <Marker kind={point.kind} label={point.marker} />
                {isLast ? null : (
                  <span className="my-1 min-h-8 w-0.5 flex-1 bg-[repeating-linear-gradient(to_bottom,var(--accent)_0_4px,transparent_4px_8px)]" />
                )}
              </div>
              <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-3.5"}`}>
                {point.kind === "origin" ? (
                  <Field id="origin" label={m.origin} required error={error(errors.origin)}>
                    <input
                      id="origin"
                      name="origin"
                      autoComplete="street-address"
                      placeholder={m.addressPlaceholder}
                      value={values.origin}
                      onChange={(event) => set("origin", event.target.value)}
                      aria-required="true"
                      aria-invalid={errors.origin ? true : undefined}
                      aria-describedby={describedBy("origin", { error: Boolean(errors.origin) })}
                      className={inputClass}
                    />
                  </Field>
                ) : point.kind === "destination" ? (
                  <Field id="destination" label={m.destination} required error={error(errors.destination)}>
                    <input
                      id="destination"
                      name="destination"
                      autoComplete="off"
                      placeholder={m.addressPlaceholder}
                      value={values.destination}
                      onChange={(event) => set("destination", event.target.value)}
                      aria-required="true"
                      aria-invalid={errors.destination ? true : undefined}
                      aria-describedby={describedBy("destination", { error: Boolean(errors.destination) })}
                      className={inputClass}
                    />
                  </Field>
                ) : (
                  <Field id={point.key} label={interpolate(m.stop, { n: point.marker })}>
                    <div className="flex gap-2">
                      <input
                        id={point.key}
                        name="stops"
                        autoComplete="off"
                        placeholder={m.addressPlaceholder}
                        value={values.stops[point.index]}
                        onChange={(event) => setStop(point.index, event.target.value)}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        aria-label={interpolate(m.removeStop, { n: point.marker })}
                        onClick={() =>
                          set(
                            "stops",
                            values.stops.filter((_, i) => i !== point.index),
                          )
                        }
                        className="grid size-12 flex-none place-items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <Icon name="close" size={18} />
                      </button>
                    </div>
                  </Field>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {errors.stops ? (
        <span role="alert" className="text-[13px] font-medium text-danger-foreground">
          {error(errors.stops)}
        </span>
      ) : null}
      <button
        type="button"
        disabled={!canAddStop}
        onClick={() => set("stops", [...values.stops, ""])}
        className={linkButton}
      >
        <Icon name="plus" size={16} strokeWidth={2.2} />
        {m.addStop}
      </button>

      <div className="grid items-start gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <Field id="date" label={m.date} required error={error(errors.date)}>
          <input
            id="date"
            name="date"
            inputMode="numeric"
            autoComplete="off"
            placeholder={m.datePlaceholder}
            value={values.date}
            onChange={(event) => set("date", event.target.value)}
            aria-required="true"
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={describedBy("date", { error: Boolean(errors.date) })}
            className={inputClass}
          />
        </Field>
        <ChoiceGroup
          name="flexibility"
          legend={m.flexibility}
          variant="chip"
          options={FLEXIBILITIES.map((value) => ({ value, label: m.flexibilities[value] }))}
          value={values.flexibility}
          onChange={(value) => set("flexibility", value)}
          error={error(errors.flexibility)}
        />
      </div>

      <ChoiceGroup
        name="source"
        legend={
          <>
            {m.source} <span className="font-normal text-muted">{t.client.optional}</span>
          </>
        }
        variant="chip"
        options={SOURCES.map((value) => ({ value, label: m.sources[value] }))}
        value={values.source}
        onChange={(value) => set("source", value)}
        error={error(errors.source)}
      />
    </fieldset>
  );
}
