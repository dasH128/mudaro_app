import { Icon } from "@/app/components/app-icon";
import { VEHICLE_TYPES, kindOf, type VehicleType } from "../../domain/new-vehicle";
import type { NewVehicleText } from "../new-vehicle-text";

type Props = { t: NewVehicleText; value: VehicleType; onChange: (type: VehicleType) => void };

/** Icono de cada tipo: camión, furgón o "+" para "Outro". */
export function TypeIcon({ type, size = 22 }: { type: VehicleType; size?: number }) {
  if (type === "other") return <Icon name="plus" size={size} strokeWidth={2.2} />;
  return <Icon name={kindOf(type) === "truck" ? "truck" : "van"} size={size} />;
}

/** Paso 1: tipo de vehículo. Radios nativos con aspecto de tarjeta. */
export function VehicleTypeSection({ t, value, onChange }: Props) {
  return (
    <fieldset id="section-type" className="flex min-w-0 scroll-mt-6 flex-col gap-3.5 rounded-[22px] border border-line bg-surface p-6">
      <legend className="sr-only">{t.type.legend}</legend>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[22px] font-extrabold">{t.type.title}</h2>
        <span className="text-sm text-muted">{t.type.subtitle}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
        {VEHICLE_TYPES.map((type) => {
          const on = type === value;
          return (
            <label
              key={type}
              className={`flex cursor-pointer flex-col items-start gap-1.5 rounded-[18px] p-4 text-left has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                on ? "border-2 border-foreground bg-surface shadow-[0_0_0_4px_var(--status-config-surface)]" : "border border-line bg-surface-soft"
              }`}
            >
              <input type="radio" name="type" value={type} checked={on} onChange={() => onChange(type)} className="sr-only" />
              <span className="flex w-full items-center justify-between">
                <span
                  aria-hidden
                  className={`grid size-10 place-items-center rounded-xl ${on ? "bg-foreground text-background" : "bg-status-config-surface text-foreground"}`}
                >
                  <TypeIcon type={type} />
                </span>
                <span aria-hidden className={`grid size-4.5 flex-none place-items-center rounded-full border-2 ${on ? "border-foreground" : "border-field-border"}`}>
                  {on ? <span className="size-2 rounded-full bg-foreground" /> : null}
                </span>
              </span>
              <span className="text-[15px] font-bold">{t.types[type].label}</span>
              <span className="text-xs text-muted">{t.types[type].hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
