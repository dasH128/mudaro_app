import { ChoiceGroup } from "@/app/components/form/choice-group";
import { Field, inputClass } from "@/app/components/form/field";
import { interpolate } from "@/app/i18n/interpolate";
import { LIFT_SIZES, type AccessPoint, type RoutePoint } from "../../domain/types";
import type { InventoryText } from "../inventory-text";

type Props = {
  t: InventoryText;
  /** Punto del recorrido: su id es el prefijo de los ids de los campos. */
  point: RoutePoint;
  value: AccessPoint;
  onChange: (value: AccessPoint) => void;
};

function Required() {
  return (
    <span aria-hidden="true" className="text-danger-foreground">
      {" "}
      *
    </span>
  );
}

/** Interruptor con checkbox nativo: se maneja con teclado y lo anuncian los lectores de pantalla. */
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] bg-surface-soft px-3.5 py-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary">
      {label}
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`relative h-6.5 w-11 flex-none rounded-full ${checked ? "bg-foreground" : "bg-status-off-border"}`}
      >
        <span className={`absolute top-0.75 size-5 rounded-full bg-surface ${checked ? "left-5.25" : "left-0.75"}`} />
      </span>
    </label>
  );
}

const BADGE_STYLE = {
  origin: "bg-foreground text-background",
  destination: "bg-primary text-primary-foreground",
  stop: "border-2 border-dashed border-accent bg-surface-head text-foreground",
} as const;

export function AccessForm({ t, point, value, onChange }: Props) {
  const a = t.access;
  const { id, place } = point;
  const kind = point.role === "stop" ? interpolate(a.kinds.stop, { n: point.stopNumber ?? "" }) : a.kinds[point.role];
  const badge = point.role === "origin" ? "A" : point.role === "destination" ? "B" : `P${point.stopNumber ?? ""}`;
  const set = <K extends keyof AccessPoint>(key: K, next: AccessPoint[K]) => onChange({ ...value, [key]: next });

  return (
    <fieldset className="flex min-w-0 flex-col gap-4.5 rounded-[20px] border border-line bg-surface p-6">
      <legend className="sr-only">{kind}</legend>
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`grid size-9 flex-none place-items-center rounded-xl text-sm font-bold ${BADGE_STYLE[point.role]}`}
        >
          {badge}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[13px] text-muted">{kind}</span>
          <span className="font-display text-xl font-extrabold">{place}</span>
        </span>
      </span>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field id={`${id}-floor`} label={a.floor} required>
          <input
            id={`${id}-floor`}
            value={value.floor}
            onChange={(e) => set("floor", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id={`${id}-parking`} label={a.parking} required>
          <div className="flex h-12 items-center overflow-hidden rounded-xl border border-field-border bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
            <input
              id={`${id}-parking`}
              inputMode="numeric"
              value={value.parkingMeters}
              onChange={(e) => set("parkingMeters", e.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-base text-foreground outline-none"
            />
            <span className="px-3.5 text-sm text-muted">{a.meters}</span>
          </div>
        </Field>
      </div>

      <ChoiceGroup
        name={`${id}-lift`}
        legend={
          <>
            <span className="sr-only">{interpolate(a.liftLabel, { place: kind })}. </span>
            {a.lift}
            <Required />
          </>
        }
        options={LIFT_SIZES.map((size) => ({ value: size, label: a.lifts[size] }))}
        value={value.lift ?? ""}
        onChange={(lift) => set("lift", lift)}
        variant="segment"
      />

      <div className="flex flex-col gap-2.5">
        <Switch label={a.narrowStairs} checked={value.narrowStairs} onChange={(checked) => set("narrowStairs", checked)} />
        <Switch
          label={a.parkingPermit}
          checked={value.needsParkingPermit}
          onChange={(checked) => set("needsParkingPermit", checked)}
        />
      </div>

      <Field id={`${id}-notes`} label={a.notes}>
        <textarea
          id={`${id}-notes`}
          rows={2}
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={a.notesPlaceholder}
          className="resize-y rounded-xl border border-field-border bg-surface px-3.5 py-3 text-base text-foreground outline-none placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </Field>
    </fieldset>
  );
}
