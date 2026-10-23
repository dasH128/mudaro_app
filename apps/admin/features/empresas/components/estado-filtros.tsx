import Link from "next/link";

import { ESTADOS, FILTER_LABEL, type EstadoEmpresa } from "@/features/empresas/domain/estado";
import { empresasHref } from "./empresas-href";

type EstadoFiltrosProps = {
  selected: EstadoEmpresa | undefined;
  q: string;
  total: number;
  counts: Record<EstadoEmpresa, number>;
};

const baseClass =
  "flex flex-col items-start gap-2 rounded-[14px] border px-4 py-3.5 text-left no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function EstadoFiltros({ selected, q, total, counts }: EstadoFiltrosProps) {
  const items: { id: EstadoEmpresa | undefined; label: string; n: number }[] = [
    { id: undefined, label: "Todas", n: total },
    ...ESTADOS.map((id) => ({ id, label: FILTER_LABEL[id], n: counts[id] })),
  ];

  return (
    <nav aria-label="Filtrar por estado" className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
      {items.map(({ id, label, n }) => {
        const isSelected = id === selected;
        return (
          <Link
            key={id ?? "todas"}
            href={empresasHref(id, q)}
            aria-current={isSelected ? "true" : undefined}
            className={`${baseClass} ${
              isSelected ? "border-foreground bg-foreground text-background" : "border-line bg-surface text-foreground"
            }`}
          >
            <span className="text-[13px] font-medium">{label}</span>
            <span className="font-display text-[28px] leading-none font-extrabold">{n}</span>
          </Link>
        );
      })}
    </nav>
  );
}
