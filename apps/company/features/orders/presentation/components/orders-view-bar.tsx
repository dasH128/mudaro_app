import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import type { OrdersFilter, OrdersView } from "../../domain/list";
import { ordersHref } from "../orders-href";
import type { OrdersListText } from "../orders-text";

type Props = {
  lang: Locale;
  t: OrdersListText;
  summary: string;
  view: OrdersView;
  stage: OrdersFilter | undefined;
  q: string;
};

const seg =
  "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Resumen de lo que se ve y selector Cartões / Lista (en la URL, sin estado de cliente). */
export function OrdersViewBar({ lang, t, summary, view, stage, q }: Props) {
  const options = [
    { key: "cards", icon: "grid", label: t.view.cards },
    { key: "list", icon: "list", label: t.view.list },
  ] as const;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[15px] text-muted">{summary}</p>
      <div role="group" aria-label={t.view.label} className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
        {options.map((option) => {
          const selected = option.key === view;
          return (
            <Link
              key={option.key}
              href={ordersHref(lang, { stage, q, view: option.key })}
              aria-current={selected ? "true" : undefined}
              className={`${seg} ${selected ? "bg-foreground text-background" : "text-foreground"}`}
            >
              <Icon name={option.icon} size={16} />
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
