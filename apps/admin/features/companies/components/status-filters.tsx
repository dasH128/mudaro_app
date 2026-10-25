import Link from "next/link";

import { STATUSES, FILTER_LABEL, type CompanyStatus } from "@/features/companies/domain/status";
import { companiesHref } from "./companies-href";

type StatusFiltersProps = {
  selected: CompanyStatus | undefined;
  q: string;
  total: number;
  counts: Record<CompanyStatus, number>;
};

const baseClass =
  "flex flex-col items-start gap-2 rounded-[14px] border px-4 py-3.5 text-left no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function StatusFilters({ selected, q, total, counts }: StatusFiltersProps) {
  const items: { id: CompanyStatus | undefined; label: string; n: number }[] = [
    { id: undefined, label: "Todas", n: total },
    ...STATUSES.map((id) => ({ id, label: FILTER_LABEL[id], n: counts[id] })),
  ];

  return (
    <nav aria-label="Filtrar por estado" className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
      {items.map(({ id, label, n }) => {
        const isSelected = id === selected;
        return (
          <Link
            key={id ?? "todas"}
            href={companiesHref(id, q)}
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
