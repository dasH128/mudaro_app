import Link from "next/link";

import { catalogHref } from "./catalog-href";
import type { CatalogTab } from "../domain/types";

const TAB_LABEL: Record<CatalogTab, string> = {
  objects: "Objetos",
  rooms: "Divisões",
  categories: "Categorias",
};

type CatalogTabsProps = {
  selected: CatalogTab;
  counts: Record<CatalogTab, number>;
};

export function CatalogTabs({ selected, counts }: CatalogTabsProps) {
  return (
    <nav aria-label="Secções do catálogo" className="flex gap-1 border-b border-line">
      {(Object.keys(TAB_LABEL) as CatalogTab[]).map((tab) => {
        const isSelected = tab === selected;
        return (
          <Link
            key={tab}
            href={catalogHref(tab)}
            aria-current={isSelected ? "page" : undefined}
            className={`-mb-px inline-flex h-11 items-center gap-2 border-b-[3px] px-4 text-[15px] font-bold no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
              isSelected ? "border-primary text-foreground" : "border-transparent text-muted"
            }`}
          >
            {TAB_LABEL[tab]}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                isSelected ? "bg-foreground text-background" : "bg-line-soft text-muted"
              }`}
            >
              {counts[tab]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
