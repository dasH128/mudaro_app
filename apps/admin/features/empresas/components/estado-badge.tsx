import { StatusPill, type PillTone } from "@/app/components/ui/status-pill";
import { ESTADO_LABEL, type EstadoEmpresa } from "@/features/empresas/domain/estado";

export const ESTADO_TONE: Record<EstadoEmpresa, PillTone> = {
  convite: "outline",
  config: "config",
  ativa: "solid",
  off: "muted",
};

export function EstadoBadge({ estado }: { estado: EstadoEmpresa }) {
  return <StatusPill tone={ESTADO_TONE[estado]}>{ESTADO_LABEL[estado]}</StatusPill>;
}
