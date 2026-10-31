import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatFullDate } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { HomeText } from "../home-text";

const control =
  "grid size-10 place-items-center rounded-full border border-status-off-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type Props = { lang: Locale; t: HomeText; today: Date; unreadNotifications: number };

export function DashboardHeader({ lang, t, today, unreadNotifications }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{t.title}</h1>
        <p className="text-base text-muted">{interpolate(t.subtitle, { date: formatFullDate(lang, today) })}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" aria-label={pluralize(lang, unreadNotifications, t.notifications)} className={`${control} relative`}>
          <Icon name="bell" />
          {unreadNotifications > 0 ? (
            <span className="absolute top-2 right-2.5 size-[9px] rounded-full border-2 border-surface bg-primary" />
          ) : null}
        </button>
        <Link
          href={localePath(lang, ROUTES.orders.new)}
          className="flex h-12 items-center justify-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Icon name="plus" size={18} strokeWidth={2.5} />
          {t.newOrder}
        </Link>
      </div>
    </header>
  );
}
