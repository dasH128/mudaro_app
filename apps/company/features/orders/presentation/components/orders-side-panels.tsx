import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDayMonthShort } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { OrderListItem, OrderStage, OrdersMetrics } from "../../domain/types";
import type { OrdersListText } from "../orders-text";

type Props = {
  lang: Locale;
  t: OrdersListText;
  upcoming: readonly OrderListItem[];
  metrics: OrdersMetrics;
};

const card = "flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-5.5";
const cardTitle = "font-display text-xl font-extrabold";

// Color de la ficha de fecha según en qué punto está el pedido
const TILE: Partial<Record<OrderStage, string>> = {
  won: "bg-foreground text-background",
  "awaiting-inventory": "bg-warn-surface text-warn-foreground",
};
const TILE_DEFAULT = "bg-background text-foreground";

export function OrdersSidePanels({ lang, t, upcoming, metrics }: Props) {
  const { side } = t;
  const peak = Math.max(...metrics.weekly.map((week) => week.count), 1);
  const lastIndex = metrics.weekly.length - 1;

  return (
    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
      <section aria-labelledby="upcoming" className={card}>
        <h2 id="upcoming" className={cardTitle}>
          {side.upcoming.title}
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">{side.upcoming.empty}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {upcoming.map((item) => {
              const { day, month } = formatDayMonthShort(lang, item.date);
              return (
                <li key={item.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-14 w-13 flex-none flex-col items-center justify-center gap-0.5 rounded-[14px] ${TILE[item.stage] ?? TILE_DEFAULT}`}
                  >
                    <span className="font-display text-xl font-extrabold leading-none">{day}</span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em]">{month}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-bold">{item.client}</span>
                    <span className="truncate text-[13px] text-muted">
                      {item.from} → {item.to} · {t.status[item.stage]}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <Link href={localePath(lang, ROUTES.schedule)} className="text-[13px] font-bold">
          {side.upcoming.agenda}
        </Link>
      </section>

      <section aria-labelledby="month" className={`${card} gap-4`}>
        <h2 id="month" className={cardTitle}>
          {side.month.title}
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1 rounded-[14px] bg-surface-head p-3.5">
            <span className="font-display text-[26px] font-extrabold leading-none">{metrics.newThisMonth}</span>
            <span className="text-xs text-muted">{pluralize(lang, metrics.newThisMonth, side.month.new)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-[14px] bg-success-surface p-3.5 text-success-foreground">
            <span className="font-display text-[26px] font-extrabold leading-none">{metrics.wonThisMonth}</span>
            <span className="text-xs">{pluralize(lang, metrics.wonThisMonth, side.month.won)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold">{side.month.chart}</span>
          <div
            role="img"
            aria-label={interpolate(side.month.chartLabel, { values: metrics.weekly.map((week) => week.count).join(", ") })}
            className="flex h-21 items-end gap-2.5 pt-1.5"
          >
            {metrics.weekly.map((week, index) => (
              <span key={week.week} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  style={{ height: `${Math.round((week.count / peak) * 64)}px` }}
                  className={`w-full rounded-t-lg rounded-b-sm ${index === lastIndex ? "bg-primary" : "bg-line"}`}
                />
                <span className={`text-[11px] ${index === lastIndex ? "font-bold" : "text-muted"}`}>
                  {interpolate(side.month.week, { week: week.week })}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="tip"
        className="relative flex flex-col gap-2 overflow-hidden rounded-[20px] border border-accent bg-status-config-surface p-5.5"
      >
        <svg aria-hidden="true" width="96" height="96" viewBox="0 0 96 96" className="absolute -right-4.5 -bottom-4.5">
          <circle cx="48" cy="48" r="40" className="fill-primary" />
          <circle cx="48" cy="48" r="18" className="fill-on-ink" />
          <circle cx="48" cy="48" r="10" className="fill-sidebar" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{side.tip.eyebrow}</span>
        <h2 id="tip" className="max-w-55 text-base font-bold">
          {side.tip.title}
        </h2>
        <p className="max-w-55 text-sm leading-normal">{side.tip.body}</p>
      </section>
    </div>
  );
}
