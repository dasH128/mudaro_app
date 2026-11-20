import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { ActivityItem, ActivityTone, FleetToday } from "@/features/dashboard/domain/types";
import { describeActivityDetail, type HomeText } from "../home-text";

const card = "flex flex-col rounded-3xl border border-line bg-surface p-5.5";
const cardTitle = "flex items-center gap-2.5 text-base font-bold";

// Accesos fijos de la interfaz (no son datos de la empresa).
const SHORTCUTS = [
  { key: "volumeCalculator", icon: "calculator", route: ROUTES.tools.volumeCalculator },
  { key: "newQuote", icon: "quotes", route: ROUTES.quotes.list },
  { key: "pricing", icon: "tags", route: ROUTES.pricing },
  { key: "sendLink", icon: "link", route: ROUTES.orders.new },
] as const;

// Colores de la leyenda de la flota; los números salen de la Agenda (paso 6.8).
const LEGEND = [
  { key: "service", swatch: "bg-foreground", stroke: "stroke-foreground" },
  { key: "loading", swatch: "bg-primary", stroke: "stroke-primary" },
  { key: "available", swatch: "bg-accent", stroke: "stroke-accent" },
] as const;

/** 2π · 52, el radio del donut. */
const CIRCUMFERENCE = 2 * Math.PI * 52;

export function FleetSummary({ lang, t, fleet }: { lang: Locale; t: HomeText; fleet: FleetToday }) {
  const f = t.fleet;
  const legend = LEGEND.map((item) => ({ ...item, value: fleet[item.key] }));
  const total = legend.reduce((sum, item) => sum + item.value, 0);
  // Arcos del donut proporcionales a cada estado, con un hueco de 2 px entre ellos
  const arcs = legend
    .reduce<{ key: string; stroke: string; start: number; share: number }[]>((acc, item) => {
      const previous = acc[acc.length - 1];
      const start = previous ? previous.start + previous.share : 0;
      return [...acc, { key: item.key, stroke: item.stroke, start, share: total === 0 ? 0 : (item.value / total) * CIRCUMFERENCE }];
    }, [])
    .filter((arc) => arc.share > 0)
    .map((arc) => ({ ...arc, length: Math.max(arc.share - (arc.share >= CIRCUMFERENCE ? 0 : 2), 0) }));
  return (
    <section aria-labelledby="fleet" className={`${card} gap-[18px]`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="fleet" className={cardTitle}>
          <Icon name="truck" size={18} />
          {f.title}
        </h2>
        <Link href={localePath(lang, ROUTES.fleet.list)} className="text-[13px] font-bold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {f.viewFleet}
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        {/* Donut: un arco por estado, proporcional a su número */}
        <svg
          width="128"
          height="128"
          viewBox="0 0 128 128"
          role="img"
          aria-label={interpolate(f.aria, { total, service: fleet.service, loading: fleet.loading, available: fleet.available })}
        >
          <circle cx="64" cy="64" r="52" fill="none" strokeWidth="14" className="stroke-line-soft" />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx="64"
              cy="64"
              r="52"
              fill="none"
              strokeWidth="14"
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={-arc.start}
              transform="rotate(-90 64 64)"
              className={arc.stroke}
            />
          ))}
          <text x="64" y="64" textAnchor="middle" fontSize="30" fontWeight="800" className="fill-foreground font-display">
            {total}
          </text>
          <text x="64" y="84" textAnchor="middle" fontSize="12" className="fill-muted">
            {f.vehicles}
          </text>
        </svg>
        <ul className="flex min-w-35 flex-1 flex-col gap-3 text-sm">
          {legend.map((item) => (
            <li key={item.key} className="flex items-center gap-2.5">
              <span className={`size-2.5 rounded-[3px] ${item.swatch}`} />
              <span className="flex-1">{f.legend[item.key]}</span>
              <strong>{item.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const DOT: Record<ActivityTone, string> = {
  primary: "bg-primary",
  ink: "bg-foreground",
  success: "bg-success-dot",
  danger: "bg-danger-dot",
};

export function RecentActivity({ lang, t, activity }: { lang: Locale; t: HomeText; activity: readonly ActivityItem[] }) {
  return (
    <section aria-labelledby="activity" className={`${card} gap-4`}>
      <h2 id="activity" className={cardTitle}>
        <Icon name="clock" size={18} />
        {t.activity.title}
      </h2>
      <ol className="flex flex-col gap-4">
        {activity.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span className={`mt-1.5 size-[9px] flex-none rounded-full ${DOT[item.tone]}`} />
            <span className="w-10 flex-none pt-px text-[13px] text-muted">{item.time}</span>
            <span className="flex flex-col gap-0.5 text-sm">
              <span>
                <strong>{item.ref}</strong> · {t.activity.events[item.event]}
              </span>
              <span className="text-[13px] text-muted">{describeActivityDetail(item, t, lang)}</span>
            </span>
          </li>
        ))}
      </ol>
      <Link href={localePath(lang, ROUTES.activity)} className="text-[13px] font-bold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {t.activity.viewAll}
      </Link>
    </section>
  );
}

export function Shortcuts({ lang, t }: { lang: Locale; t: HomeText }) {
  return (
    <section aria-labelledby="shortcuts" className={`${card} gap-4`}>
      <h2 id="shortcuts" className="text-base font-bold">
        {t.shortcuts.title}
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.key}
            href={localePath(lang, item.route)}
            className="flex items-center gap-2.5 rounded-2xl border border-line-soft p-3 text-sm font-medium hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="grid size-9 flex-none place-items-center rounded-xl bg-background">
              <Icon name={item.icon} size={18} />
            </span>
            {t.shortcuts[item.key]}
          </Link>
        ))}
      </div>
    </section>
  );
}
