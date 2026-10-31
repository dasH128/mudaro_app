import { avatarTone } from "@/app/lib/avatar-tone";
import { initials } from "@/features/orders/domain/client-name";
import type { ClientType } from "@/features/orders/domain/types";
import type { ClientStage } from "../../domain/types";

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const STAGE: Record<ClientStage, string> = {
  new: "bg-line-soft text-muted",
  "awaiting-inventory": "bg-info-surface text-foreground",
  "inventory-received": "bg-primary text-primary-foreground",
  quoted: "bg-info-surface text-foreground",
  scheduled: "bg-foreground text-background",
  "in-progress": "bg-warn-surface text-warn-foreground",
  done: "bg-success-surface text-success-foreground",
  lost: "bg-danger-surface text-danger-foreground",
};

/** Pastilla de situación del cliente o de uno de sus pedidos. */
export function StageBadge({ stage, label }: { stage: ClientStage; label: string }) {
  return (
    <span className={`inline-flex h-6 items-center self-start whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${STAGE[stage]}`}>
      {label}
    </span>
  );
}

/** Etiqueta pequeña "Empresa" (tinta) o "Particular" (neutra). */
export function TypeTag({ type, label }: { type: ClientType; label: string }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-md px-2 text-[11px] font-bold ${type === "company" ? "bg-foreground text-background" : "bg-line-soft text-muted"}`}
    >
      {label}
    </span>
  );
}

/** Insignia pequeña de aviso (naranja) o de éxito (verde). */
export function Badge({ tone, children }: { tone: "warn" | "success"; children: string }) {
  return (
    <span
      className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-[11px] font-bold ${tone === "warn" ? "bg-warn-surface text-warn-foreground" : "bg-success-surface text-success-foreground"}`}
    >
      {children}
    </span>
  );
}

const TONES = ["bg-foreground text-background", "bg-status-config-surface text-foreground", "bg-accent text-foreground"] as const;

/** Iniciales sobre círculo (particular) o cuadrado redondeado (empresa), con tono estable por cliente. */
export function ClientAvatar({ id, name, type, size }: { id: string; name: string; type: ClientType; size: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      className={`grid flex-none place-items-center font-bold ${type === "company" ? "rounded-xl" : "rounded-full"} ${TONES[avatarTone(id)]}`}
    >
      {initials(name)}
    </span>
  );
}
