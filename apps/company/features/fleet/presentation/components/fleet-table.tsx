import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatCubicMeters, formatInteger } from "@/app/lib/format";
import { isIdle } from "../../domain/fleet";
import type { Vehicle } from "../../domain/types";
import { fleetHref, type FleetParams } from "../fleet-href";
import { describeInactive, describeLastUse, describeNextUse, describeStatus, type FleetText } from "../fleet-text";
import { IssueBadge, StatusPill, VehicleTile, focusRing } from "./fleet-parts";

type Props = {
  lang: Locale;
  t: FleetText;
  active: Vehicle[];
  inactive: Vehicle[];
  selectedId: string | undefined;
  /** Filtros actuales, para conservarlos en los enlaces de cada fila. */
  params: Omit<FleetParams, "vehicle">;
  today: string;
  /** Con el panel abierto se ocultan "Último uso" y "Próximo uso" para dar sitio. */
  compact: boolean;
  /** Mensaje cuando no hay ningún vehículo (búsqueda o filtro sin resultados). */
  emptyMessage: string;
};

// Plantillas de columnas (estáticas para que Tailwind las genere)
const COLS_FULL = "grid-cols-[minmax(240px,1.6fr)_minmax(150px,1fr)_100px_minmax(120px,0.8fr)_minmax(150px,1fr)_minmax(130px,0.8fr)_44px]";
const COLS_COMPACT = "grid-cols-[minmax(230px,1.5fr)_minmax(130px,1fr)_100px_minmax(120px,0.8fr)_44px]";

const cell = "flex min-w-0 flex-col gap-1 px-2.5";

type RowProps = Omit<Props, "active" | "inactive" | "emptyMessage"> & { vehicle: Vehicle };

function VehicleRow({ lang, t, vehicle, selectedId, params, today, compact }: RowProps) {
  const selected = vehicle.id === selectedId;
  const href = fleetHref(lang, { ...params, vehicle: vehicle.id });
  const status = describeStatus(vehicle, t);
  const inactive = describeInactive(vehicle, t);
  const last = describeLastUse(vehicle, t, lang, today);
  const next = describeNextUse(vehicle, t, today);
  const idle = isIdle(vehicle, today);
  const { proposals30d } = vehicle;
  const muted = vehicle.active ? "" : "text-muted";

  return (
    <div
      role="row"
      className={`grid min-h-16 items-center rounded-2xl hover:bg-surface-soft ${compact ? COLS_COMPACT : COLS_FULL} ${selected ? "bg-surface-soft ring-2 ring-inset ring-foreground" : ""}`}
    >
      <div role="cell" className="flex min-w-0 items-center gap-3 px-3 py-2.5">
        <VehicleTile vehicle={vehicle} size={40} iconSize={20} radius="rounded-xl" />
        <span className="flex min-w-0 flex-col gap-0.75">
          <Link
            href={href}
            scroll={false}
            aria-label={interpolate(t.table.viewDetail, { name: vehicle.name })}
            className={`w-fit whitespace-nowrap text-[15px] font-bold hover:underline ${vehicle.active ? "text-foreground" : "text-muted"} ${focusRing}`}
          >
            {vehicle.name}
          </Link>
          <span className="font-mono text-xs font-bold text-muted">{vehicle.plate}</span>
          {vehicle.active && vehicle.costMissing ? <IssueBadge>{t.table.costMissing}</IssueBadge> : null}
        </span>
      </div>

      <div role="cell" className={cell}>
        <StatusPill state={status.state} label={vehicle.active ? status.label : inactive.reason} dot={vehicle.active} />
        <span className="truncate text-xs text-muted">{vehicle.active ? status.note : inactive.since}</span>
      </div>

      <div role="cell" className={`${cell} ${muted}`}>
        <strong className="text-[15px]">{formatCubicMeters(vehicle.capacityM3)}</strong>
        <span className="text-xs text-muted">{formatInteger(vehicle.maxLoadKg)} kg</span>
      </div>

      {compact ? null : (
        <>
          <div role="cell" className={`${cell} ${muted}`}>
            <strong className="whitespace-nowrap text-sm">{last.title}</strong>
            <span className={`truncate text-xs ${idle ? "font-bold text-warn-foreground" : "text-muted"}`}>{last.sub}</span>
          </div>
          <div role="cell" className={`${cell} ${muted}`}>
            <strong className="whitespace-nowrap text-sm">{next.title}</strong>
            <span className="truncate text-xs text-muted">{next.sub}</span>
          </div>
        </>
      )}

      <div role="cell" className={`${cell} gap-0.5`}>
        {vehicle.active ? (
          <>
            <span className="text-sm">
              <strong className="font-display text-lg">{proposals30d.total}</strong>{" "}
              <span className="text-[13px] text-muted">{pluralize(lang, proposals30d.total, t.proposalsWord)}</span>
            </span>
            <span className="text-xs font-bold text-success-foreground">
              {pluralize(lang, proposals30d.accepted, t.acceptedWord)}
            </span>
          </>
        ) : (
          <span className="text-[13px] text-muted">{t.table.notIncluded}</span>
        )}
      </div>

      <div role="cell">
        <Link
          href={href}
          scroll={false}
          aria-label={interpolate(t.table.open, { name: vehicle.name })}
          className={`mx-1 grid size-9 place-items-center rounded-full ${focusRing} ${selected ? "bg-foreground text-background" : "border border-status-off-border bg-surface text-foreground"}`}
        >
          <Icon name="chevronRight" size={16} strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  );
}

export function FleetTable({ active, inactive, emptyMessage, ...props }: Props) {
  const { t, compact } = props;
  const head = [t.table.vehicle, t.table.status, t.table.capacity, ...(compact ? [] : [t.table.lastUse, t.table.nextUse]), t.table.proposals];

  return (
    <section aria-labelledby="fleet-table" className="overflow-x-auto rounded-3xl border border-line bg-surface px-2 pt-2 pb-3">
      <h2 id="fleet-table" className="sr-only">
        {t.table.title}
      </h2>
      <div role="table" aria-labelledby="fleet-table" className={compact ? "min-w-150" : "min-w-220"}>
        <div role="row" className={`mb-1 grid items-center border-b border-line-soft ${compact ? COLS_COMPACT : COLS_FULL}`}>
          {head.map((label, index) => (
            <span
              key={label}
              role="columnheader"
              className={`whitespace-nowrap px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted ${index === 0 ? "pl-3" : ""}`}
            >
              {label}
            </span>
          ))}
          <span role="columnheader">
            <span className="sr-only">{t.table.actions}</span>
          </span>
        </div>

        {active.length === 0 && inactive.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted">{emptyMessage}</p>
        ) : null}
        {active.map((vehicle) => (
          <VehicleRow key={vehicle.id} vehicle={vehicle} {...props} />
        ))}

        {inactive.length > 0 ? (
          <details open className="group">
            <summary className="mt-2 flex w-full cursor-pointer list-none items-center gap-2 border-t border-dashed border-line p-3 text-[13px] font-bold text-muted [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="inline-flex transition-transform group-open:rotate-90">
                <Icon name="chevronRight" size={14} strokeWidth={2.4} />
              </span>
              {interpolate(t.table.inactiveTitle, { count: inactive.length })}
              <span className="font-medium">{t.table.inactiveHint}</span>
            </summary>
            {inactive.map((vehicle) => (
              <VehicleRow key={vehicle.id} vehicle={vehicle} {...props} />
            ))}
          </details>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 pt-2.5 text-xs text-muted">
        <span>{t.table.footnote}</span>
        {/* La agenda aún no existe */}
        <span title={t.soon} className="cursor-not-allowed font-bold opacity-50">
          {t.table.openSchedule}
        </span>
      </div>
    </section>
  );
}
