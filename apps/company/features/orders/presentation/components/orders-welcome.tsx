import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { ordersHref } from "../orders-href";
import type { OrdersListText } from "../orders-text";

type Props = {
  lang: Locale;
  t: OrdersListText;
  name: string;
  /** "morning", "afternoon" o "evening". */
  period: keyof OrdersListText["welcome"]["greeting"];
  /** Fecha larga ya formateada: "Quinta-feira, 29 de outubro". */
  dateLabel: string;
  summary: { total: number; ready: number; nudge: number };
};

// Cubos decorativos de la marca: [x, y, escala]
const CUBES = [
  [-6, 62, 0.58],
  [92, 52, 0.82],
  [118, -6, 0.5],
] as const;

export function OrdersWelcome({ lang, t, name, period, dateLabel, summary }: Props) {
  const { welcome } = t;
  const greeting = welcome.greeting[period];
  const { total, ready, nudge } = summary;

  return (
    <section
      aria-labelledby="hello"
      className="relative flex flex-wrap items-center gap-6 overflow-hidden rounded-3xl bg-sidebar px-6 py-8 text-white sm:px-9"
    >
      <span aria-hidden="true" className="absolute -top-20 -right-15 size-70 rounded-full bg-white/5" />
      <span aria-hidden="true" className="absolute -bottom-30 right-40 size-50 rounded-full bg-primary/10" />
      <div className="relative flex min-w-0 flex-[1_1_380px] flex-col gap-3">
        <span className="inline-flex h-7 items-center gap-2 self-start rounded-full bg-white/10 px-3 text-[13px] font-bold text-on-ink">
          <span className="size-2 rounded-full bg-primary" />
          {dateLabel}
        </span>
        <h2 id="hello" className="font-display text-[34px] font-extrabold leading-[1.1] tracking-tight">
          {total > 0
            ? pluralize(lang, total, welcome.title, { greeting, name })
            : interpolate(welcome.titleNone, { greeting, name })}
        </h2>
        <p className="max-w-140 text-base leading-normal text-on-ink">
          {total > 0
            ? [
                ready > 0 ? pluralize(lang, ready, welcome.ready) : null,
                nudge > 0 ? pluralize(lang, nudge, ready > 0 ? welcome.nudgeAlso : welcome.nudge) : null,
              ]
                .filter(Boolean)
                .join(" ")
            : welcome.bodyNone}
        </p>
        {total > 0 ? (
          <div className="mt-1.5">
            <Link
              href={ordersHref(lang, { stage: "action" })}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4.5 text-[15px] font-bold text-sidebar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {welcome.cta}
              <Icon name="arrowRight" size={16} strokeWidth={2.2} />
            </Link>
          </div>
        ) : null}
      </div>
      <svg aria-hidden="true" width="260" height="190" viewBox="0 0 260 190" className="relative flex-none">
        <path d="M18 160 C 60 120, 70 60, 120 70" fill="none" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" className="stroke-accent" />
        {CUBES.map(([x, y, scale]) => (
          <g key={`${x}-${y}`} transform={`translate(${x},${y}) scale(${scale})`}>
            <polygon points="100,30 40,62 100,94 160,62" className="fill-on-ink" />
            <polygon points="40,62 100,94 100,170 40,138" className="fill-accent" />
            <polygon points="100,94 160,62 160,138 100,170" className="fill-accent opacity-80" />
            <polygon points="64,49.2 76,42.8 136,74.8 124,81.2" className="fill-primary" />
            <polygon points="124,81.2 136,74.8 136,118 124,124.4" className="fill-primary" />
          </g>
        ))}
        <circle cx="40" cy="38" r="16" className="fill-primary" />
        <circle cx="40" cy="38" r="7" className="fill-on-ink" />
        <circle cx="40" cy="38" r="4" className="fill-sidebar" />
      </svg>
    </section>
  );
}
