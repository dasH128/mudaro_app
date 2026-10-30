import { Icon } from "@/app/components/app-icon";
import type { Vehicle } from "../../domain/types";
import type { VehicleState } from "../../domain/fleet";

const PILL: Record<VehicleState, string> = {
  busy: "bg-warn-surface text-warn-foreground",
  free: "bg-success-surface text-success-foreground",
  inactive: "bg-line-soft text-muted",
};
const DOT: Record<VehicleState, string> = {
  busy: "bg-primary",
  free: "bg-success-dot",
  inactive: "bg-accent",
};

/** Insignia de estado. Con `dot`, lleva el punto de color (tabla). */
export function StatusPill({ state, label, dot = false }: { state: VehicleState; label: string; dot?: boolean }) {
  return (
    <span
      className={`inline-flex h-6.5 items-center gap-1.5 self-start whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${PILL[state]}`}
    >
      {dot ? <span aria-hidden className={`size-1.75 rounded-full ${DOT[state]}`} /> : null}
      {label}
    </span>
  );
}

/** Aviso naranja pequeño: "Custo por km em falta". */
export function IssueBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex h-5 items-center self-start whitespace-nowrap rounded-full bg-warn-surface px-2 text-[11px] font-bold text-warn-foreground">
      {children}
    </span>
  );
}

type TileProps = { vehicle: Vehicle; size: number; iconSize: number; radius: string };

/** Ficha con el icono del vehículo: camión en tinta, furgão en kraft claro, inactivo apagado. */
export function VehicleTile({ vehicle, size, iconSize, radius }: TileProps) {
  const look = !vehicle.active
    ? "bg-line-soft text-muted"
    : vehicle.kind === "truck"
      ? "bg-foreground text-background"
      : "bg-status-config-surface text-foreground";
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={`grid flex-none place-items-center ${radius} ${look}`}
    >
      <Icon name={vehicle.kind === "truck" ? "truck" : "van"} size={iconSize} />
    </span>
  );
}

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
