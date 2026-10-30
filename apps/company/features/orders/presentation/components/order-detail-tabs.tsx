import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { DETAIL_TABS, type DetailTab } from "../../domain/detail";
import { orderDetailHref } from "../orders-href";
import type { OrderDetailText } from "../orders-text";

type Props = {
  lang: Locale;
  t: OrderDetailText;
  id: string;
  current: DetailTab;
  /** Contador de cada pestaña que lo lleva. */
  counts: Partial<Record<DetailTab, number>>;
};

/** Pestañas del detalle. La elegida viaja en la URL (`?tab=`), no en estado de cliente. */
export function OrderDetailTabs({ lang, t, id, current, counts }: Props) {
  return (
    <nav aria-label={t.tabs.label} className="flex flex-wrap gap-1.5 self-start rounded-full border border-line bg-surface p-1.5">
      {DETAIL_TABS.map((tab) => {
        const on = tab === current;
        const count = counts[tab];
        return (
          <Link
            key={tab}
            href={orderDetailHref(lang, id, tab)}
            scroll={false}
            aria-current={on ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              on ? "bg-foreground text-background" : "text-foreground hover:bg-surface-soft"
            }`}
          >
            {t.tabs[tab]}
            {count === undefined ? null : (
              <span
                className={`inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-xs ${
                  on ? "bg-background/20 text-background" : "bg-background text-foreground"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
