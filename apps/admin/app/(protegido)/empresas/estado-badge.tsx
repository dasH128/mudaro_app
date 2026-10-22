import { ESTADO_LABEL, type EstadoEmpresa } from "./_data/estado";

const STYLE: Record<EstadoEmpresa, string> = {
  convite: "border-field-border bg-surface text-foreground",
  config: "border-accent bg-status-config-surface text-foreground",
  ativa: "border-foreground bg-foreground text-background",
  off: "border-status-off-border bg-line-soft text-muted",
};

export function EstadoBadge({ estado }: { estado: EstadoEmpresa }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-1 text-[13px] font-bold ${STYLE[estado]}`}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}
