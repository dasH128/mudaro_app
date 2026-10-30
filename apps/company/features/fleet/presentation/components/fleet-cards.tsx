import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { pluralize } from "@/app/i18n/interpolate";
import { formatCubicMeters } from "@/app/lib/format";
import type { Vehicle } from "../../domain/types";
import { fleetHref, type FleetParams } from "../fleet-href";
import { describeInactive, describeLastUse, describeNextUse, describeStatus, type FleetText } from "../fleet-text";
import { IssueBadge, StatusPill, VehicleTile, focusRing } from "./fleet-parts";

type Props = {
  lang: Locale;
  t: FleetText;
  /** Activos y después inactivos. */
  vehicles: Vehicle[];
  selectedId: string | undefined;
  params: Omit<FleetParams, "vehicle">;
  today: string;
  emptyMessage: string;
};

export function FleetCards({ lang, t, vehicles, selectedId, params, today, emptyMessage }: Props) {
  if (vehicles.length === 0) {
    return <p className="rounded-3xl border border-line bg-surface px-3 py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
      {vehicles.map((vehicle) => {
        const selected = vehicle.id === selectedId;
        const status = describeStatus(vehicle, t);
        const last = describeLastUse(vehicle, t, lang, today);
        const next = describeNextUse(vehicle, t, today);
        const { proposals30d } = vehicle;

        return (
          <li
            key={vehicle.id}
            className={`relative flex h-full flex-col gap-3 rounded-[20px] p-4.5 transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(27,31,59,0.10)] ${
              vehicle.active ? "bg-surface" : "bg-surface-soft"
            } ${selected ? "border-2 border-foreground shadow-[0_0_0_4px_var(--status-config-surface)]" : "border border-line"}`}
          >
            <span className="flex items-center gap-3">
              <VehicleTile vehicle={vehicle} size={44} iconSize={22} radius="rounded-[14px]" />
              <span className="flex min-w-0 flex-col">
                {/* Enlace estirado: toda la tarjeta abre el panel */}
                <Link
                  href={fleetHref(lang, { ...params, vehicle: vehicle.id })}
                  scroll={false}
                  className={`text-[15px] font-bold after:absolute after:inset-0 after:rounded-[20px] ${focusRing}`}
                >
                  {vehicle.name}
                </Link>
                <span className="text-xs text-muted">
                  <span className="font-mono font-bold text-foreground">{vehicle.plate}</span> · {formatCubicMeters(vehicle.capacityM3)}
                </span>
              </span>
            </span>
            <span className="flex min-h-6.5 flex-wrap items-center gap-1.5">
              <StatusPill state={status.state} label={vehicle.active ? status.label : describeInactive(vehicle, t).reason} />
              {vehicle.active && vehicle.costMissing ? <IssueBadge>{t.table.costMissing}</IssueBadge> : null}
            </span>
            <span className="grid grid-cols-2 gap-2 text-xs text-muted">
              <span className="flex flex-col">
                {t.cards.lastUse}
                <strong className="text-[13px] text-foreground">{last.title}</strong>
                <span className="min-h-4 truncate">{last.sub}</span>
              </span>
              <span className="flex flex-col">
                {t.cards.next}
                <strong className="text-[13px] text-foreground">{next.title}</strong>
                <span className="min-h-4 truncate">{next.sub}</span>
              </span>
            </span>
            <span className="mt-auto text-[13px] text-muted">
              {t.cards.in} <strong className="text-foreground">{proposals30d.total}</strong>{" "}
              {pluralize(lang, proposals30d.total, t.proposalsWord)} · {pluralize(lang, proposals30d.accepted, t.acceptedWord)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
