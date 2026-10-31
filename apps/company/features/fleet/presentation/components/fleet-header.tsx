import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import { pluralize } from "@/app/i18n/interpolate";
import type { Locale } from "@/app/i18n/config";
import { formatCubicMeters } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { FleetSummary } from "../../domain/fleet";
import type { FleetText } from "../fleet-text";
import { CapacityPill } from "./capacity-pill";
import { focusRing } from "./fleet-parts";

type Props = { lang: Locale; t: FleetText; summary: FleetSummary };

const chip =
  "inline-flex h-8.5 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px]";

export function FleetHeader({ lang, t, summary }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{t.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CapacityPill capacity={formatCubicMeters(summary.capacityM3)} suffix={t.capacity.suffix} help={t.capacity.help} />
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            <strong>{summary.busy}</strong> {t.summary.busy}
          </span>
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-success-dot" />
            <strong>{summary.free}</strong> {t.summary.free}
          </span>
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-accent" />
            <strong>{summary.inactive}</strong> {pluralize(lang, summary.inactive, t.summary.inactive)}
          </span>
        </div>
      </div>
      <Link
        href={localePath(lang, ROUTES.fleet.new)}
        className={`flex h-12 items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground shadow-md ${focusRing}`}
      >
        <Icon name="plus" size={18} strokeWidth={2.5} />
        {t.add}
      </Link>
    </header>
  );
}
