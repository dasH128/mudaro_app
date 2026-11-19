import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDecimal, formatEuro, formatPercent } from "@/app/lib/format";
import { ordersHref } from "@/features/orders/presentation/orders-href";
import type { QuoteMetrics } from "@/features/quotes/domain/types";
import type { QuotesText } from "../quotes-text";

type Props = {
  lang: Locale;
  t: QuotesText;
  summary: { drafts: number; awaitingCount: number; awaitingCents: number };
  metrics: QuoteMetrics;
};

const chip = "inline-flex h-8.5 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px]";

export function QuotesHeader({ lang, t, summary, metrics }: Props) {
  const { stats } = t;

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{t.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8.5 items-center gap-2 rounded-full bg-foreground px-3.5 text-sm text-background" title={stats.toSend.hint}>
            <strong className="font-display text-[17px]">{summary.drafts}</strong> {stats.toSend.label.toLowerCase()}
          </span>
          <span
            className={chip}
            title={interpolate(stats.awaiting.hint, { amount: formatEuro(summary.awaitingCents) })}
          >
            <span aria-hidden className="size-2 rounded-full bg-foreground" />
            <strong>{summary.awaitingCount}</strong> {stats.awaiting.label.toLowerCase()}
          </span>
          <span className={chip} title={stats.acceptance.hint}>
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            <strong>{formatPercent(metrics.acceptanceRate)}</strong> {stats.acceptance.label.toLowerCase()}
          </span>
          <span className={chip} title={stats.timeToQuote.hint}>
            <span aria-hidden className="size-2 rounded-full bg-success-dot" />
            <strong>{interpolate(stats.timeToQuote.value, { days: formatDecimal(metrics.averageDaysToQuote) })}</strong>{" "}
            {stats.timeToQuote.label.toLowerCase()}
          </span>
        </div>
      </div>
      <Link
        href={ordersHref(lang, { stage: "inventory-received" })}
        className="flex h-12 items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <Icon name="plus" size={18} strokeWidth={2.5} />
        {t.new}
      </Link>
    </header>
  );
}
