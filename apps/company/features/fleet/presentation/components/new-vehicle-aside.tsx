import { Icon } from "@/app/components/app-icon";
import { interpolate } from "@/app/i18n/interpolate";
import { formatCompact } from "@/app/lib/format";
import type { FormValues } from "../../application/schemas/new-vehicle";
import { kindOf, parseDecimal, type VehicleType } from "../../domain/new-vehicle";
import { normalizePlate } from "../../domain/plate";
import type { VehicleState } from "../../domain/fleet";
import type { FleetText } from "../fleet-text";
import type { NewVehicleText } from "../new-vehicle-text";
import { StatusPill } from "./fleet-parts";
import { TypeIcon } from "./vehicle-type-section";

export type SectionProgress = { type: boolean; identification: boolean; capacity: boolean; availability: boolean };

const SECTIONS = ["type", "identification", "capacity", "availability"] as const;
const SOON = ["documents", "photos", "maintenance"] as const;

/** Índice de secciones del formulario, con una marca en las ya completas. */
export function SectionNav({ t, progress }: { t: NewVehicleText; progress: SectionProgress }) {
  const n = t.nav;

  return (
    <nav aria-label={n.label} className="flex flex-col gap-1 rounded-[20px] border border-line bg-surface p-3 lg:sticky lg:top-6 lg:flex-[0_0_246px]">
      <span className="px-2.5 pt-1.5 pb-2 text-[11px] font-bold tracking-[0.16em] text-muted uppercase">{n.title}</span>
      {SECTIONS.map((key) => (
        <a
          key={key}
          href={`#section-${key}`}
          className="flex items-center gap-2.5 rounded-xl p-2.5 text-sm font-bold hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span
            aria-hidden
            className={`grid size-5.5 flex-none place-items-center rounded-full text-[11px] font-bold ${progress[key] ? "bg-foreground text-background" : "box-border border-2 border-accent text-muted"}`}
          >
            {progress[key] ? "✓" : "·"}
          </span>
          <span className="flex-1">{n[key]}</span>
          <span className="sr-only">{progress[key] ? n.done : n.todo}</span>
        </a>
      ))}
      {SOON.map((key) => (
        <span key={key} aria-disabled="true" className="flex items-center gap-2.5 rounded-xl p-2.5 text-sm text-muted">
          <span aria-hidden className="box-border size-5.5 flex-none rounded-full border-2 border-dashed border-status-off-border" />
          <span className="flex-1">{n[key]}</span>
          <span className="shrink-0 rounded-full bg-line-soft px-1.5 py-0.5 text-[10px] font-bold tracking-[0.06em] whitespace-nowrap uppercase">{n.soon}</span>
        </span>
      ))}
    </nav>
  );
}

type AsideProps = {
  t: NewVehicleText;
  statusLabels: FleetText["status"];
  values: FormValues;
  /** Capacidad de la flota activa hoy, en m³. */
  fleetCapacityM3: number;
  checks: { plate: boolean; capacity: boolean; cost: boolean };
};

/** "Assim aparece na frota", impacto en las propostas y lista de comprobaciones. */
export function NewVehicleAside({ t: n, statusLabels, values, fleetCapacityM3, checks }: AsideProps) {
  const type: VehicleType = values.type;
  const active = values.active === "true";
  const capacity = parseDecimal(values.capacity);
  const hasCapacity = Number.isFinite(capacity) && capacity > 0;
  const state: VehicleState = active ? "free" : "inactive";
  const name = values.name.trim() || n.preview.newName;
  const total = active && hasCapacity ? fleetCapacityM3 + capacity : fleetCapacityM3;
  const impact = !hasCapacity ? n.impact.needCapacity : active ? interpolate(n.impact.active, { capacity: formatCompact(capacity) }) : n.impact.inactive;
  const truck = kindOf(type) === "truck";

  const items = [
    { ok: checks.plate, label: n.checks.plate },
    { ok: checks.capacity, label: n.checks.capacity },
    { ok: checks.cost, label: n.checks.cost },
  ];

  return (
    <aside aria-labelledby="preview" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 lg:sticky lg:top-6">
      <section className="flex flex-col gap-3.5 rounded-[22px] border border-line bg-surface p-5.5">
        <h2 id="preview" className="text-[13px] font-bold tracking-[0.14em] text-muted uppercase">
          {n.preview.title}
        </h2>
        <div className="flex items-center gap-3 rounded-2xl border border-line-soft bg-surface-soft p-3.5">
          <span
            aria-hidden
            className={`grid size-10 flex-none place-items-center rounded-xl ${truck ? "bg-foreground text-background" : "bg-status-config-surface text-foreground"}`}
          >
            <TypeIcon type={type === "other" ? "van" : type} size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="truncate text-[15px]">{name}</strong>
            <span className="text-xs text-muted">
              {values.plate.trim() ? <span className="font-mono font-bold text-foreground">{normalizePlate(values.plate) ?? values.plate.trim().toUpperCase()}</span> : n.preview.noPlate} ·{" "}
              {hasCapacity ? `${formatCompact(capacity)} m³` : n.preview.noCapacity}
            </span>
          </span>
          <StatusPill state={state} label={statusLabels[state]} />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[22px] bg-foreground p-5.5 text-background">
        <h2 className="text-[15px] font-bold">{n.impact.title}</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-sm opacity-80">{n.impact.fleet}</span>
          <span className="text-sm line-through opacity-80">{formatCompact(fleetCapacityM3)} m³</span>
          <span className="font-display text-[28px] font-extrabold">{formatCompact(total)} m³</span>
        </div>
        <span className="text-sm leading-normal opacity-80">{impact}</span>
      </section>

      <section className="flex flex-col gap-2.5 rounded-[22px] border border-line bg-surface px-5.5 py-4.5">
        <h2 className="text-[15px] font-bold">{n.checks.title}</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`grid size-5 flex-none place-items-center rounded-full ${item.ok ? "bg-success-surface text-success-foreground" : "box-border border-2 border-warn-border bg-warn-surface"}`}
              >
                {item.ok ? <Icon name="check" size={12} strokeWidth={3.4} /> : null}
              </span>
              <span className={item.ok ? "" : "font-bold text-warn-foreground"}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
