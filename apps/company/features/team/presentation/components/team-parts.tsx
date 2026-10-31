import { avatarTone } from "@/app/lib/avatar-tone";
import { initials } from "@/features/orders/domain/client-name";
import { stateOf, type PersonState } from "../../domain/team";
import type { Person } from "../../domain/types";

const PILL: Record<PersonState, string> = {
  busy: "bg-warn-surface text-warn-foreground",
  free: "bg-success-surface text-success-foreground",
  invite: "bg-info-surface text-foreground",
  inactive: "bg-line-soft text-muted",
};
const DOT: Record<PersonState, string> = {
  busy: "bg-primary",
  free: "bg-success-dot",
  invite: "border-2 border-foreground",
  inactive: "bg-accent",
};

/** Insignia de estado. Con `dot`, lleva el punto de color (tabla); el convite lo lleva hueco. */
export function StatusPill({ state, label, dot = false }: { state: PersonState; label: string; dot?: boolean }) {
  return (
    <span
      className={`inline-flex h-6.5 items-center gap-1.5 self-start whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${PILL[state]}`}
    >
      {dot ? <span aria-hidden className={`size-1.75 rounded-full ${DOT[state]}`} /> : null}
      {label}
    </span>
  );
}

/** Aviso naranja pequeño: "Telemóvel em falta". */
export function IssueBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex h-5 items-center self-start whitespace-nowrap rounded-full bg-warn-surface px-2 text-[11px] font-bold text-warn-foreground">
      {children}
    </span>
  );
}

const TONES = ["bg-foreground text-background", "bg-status-config-surface text-foreground", "bg-accent text-foreground"] as const;

/** Círculo con las iniciales: tinta, cartón o kraft; el convite va punteado y el inactivo apagado. */
export function PersonAvatar({ person, size }: { person: Person; size: number }) {
  const state = stateOf(person);
  const look =
    state === "invite"
      ? "border-2 border-dashed border-field-border bg-surface text-muted"
      : state === "inactive"
        ? "bg-line-soft text-muted"
        : TONES[avatarTone(person.id)];
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
      className={`grid flex-none place-items-center rounded-full font-bold ${look}`}
    >
      {initials(person.name)}
    </span>
  );
}

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
