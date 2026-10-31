import Link from "next/link";

import { Icon, type IconName } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDayMonth } from "@/app/lib/format";
import type { ScheduleAlerts } from "../../domain/schedule";
import { scheduleHref } from "../schedule-href";
import { describeDay, firstName, joinNames, type ScheduleText } from "../schedule-text";
import { focusRing } from "./schedule-parts";

type Props = { lang: Locale; t: ScheduleText; alerts: ScheduleAlerts; today: string };

type CardProps = { icon: IconName; title: string; text: string; href: string; action: string; tone: "warn" | "dashed" | "success" };

const TONES = {
  warn: { card: "border border-warn-border bg-warn-surface", tile: "bg-primary text-primary-foreground", text: "text-warn-foreground", link: "text-warn-foreground" },
  dashed: { card: "border border-dashed border-warn-border bg-surface", tile: "bg-foreground text-background", text: "text-muted", link: "text-foreground" },
  success: { card: "border border-line bg-surface", tile: "bg-success-surface text-success-foreground", text: "text-muted", link: "text-foreground" },
} as const;

function AlertCard({ icon, title, text, href, action, tone }: CardProps) {
  const look = TONES[tone];
  return (
    <article className={`flex gap-4 rounded-[20px] p-5 ${look.card}`}>
      <span aria-hidden className={`grid size-12 flex-none place-items-center rounded-xl ${look.tile}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className={`flex flex-col gap-1 text-sm leading-snug ${tone === "warn" ? look.text : ""}`}>
        <strong>{title}</strong>
        <span className={look.text}>{text}</span>
        <Link href={href} scroll={false} className={`text-[13px] font-bold underline ${look.link} ${focusRing}`}>
          {action}
        </Link>
      </span>
    </article>
  );
}

const upperFirst = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

/** Hasta tres avisos de la agenda, solo los que aplican. */
export function ScheduleAlertsSection({ lang, t, alerts, today }: Props) {
  const { shortCrew, noResources, toClose } = alerts;
  const a = t.alerts;
  if (!shortCrew && !noResources && !toClose) return null;

  return (
    <section aria-label={a.label} className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
      {shortCrew ? (
        <AlertCard
          icon="userMinus"
          tone="warn"
          title={interpolate(a.shortCrew.title, {
            when: upperFirst(describeDay(shortCrew.job.date, today, t)),
            id: shortCrew.job.id,
            have: shortCrew.job.crewIds.length,
            need: shortCrew.job.crewNeeded,
          })}
          text={
            shortCrew.free.length > 0
              ? interpolate(a.shortCrew.text, {
                  client: shortCrew.job.client,
                  time: shortCrew.job.start,
                  names: joinNames(shortCrew.free.slice(0, 3).map((p) => firstName(p.name)), lang),
                })
              : interpolate(a.shortCrew.textNoFree, { client: shortCrew.job.client, time: shortCrew.job.start })
          }
          href={scheduleHref(lang, { date: shortCrew.job.date, job: shortCrew.job.id })}
          action={a.shortCrew.action}
        />
      ) : null}
      {noResources ? (
        <AlertCard
          icon="check"
          tone="dashed"
          title={interpolate(a.noResources.title, {
            id: noResources.id,
            when: describeDay(noResources.detail?.acceptedOn ?? today, today, t),
          })}
          text={interpolate(a.noResources.text, { client: noResources.client, date: formatDayMonth(noResources.date) })}
          href={scheduleHref(lang, { date: noResources.date, job: noResources.id })}
          action={a.noResources.action}
        />
      ) : null}
      {toClose ? (
        <AlertCard
          icon="clock"
          tone="success"
          title={interpolate(a.toClose.title, { id: toClose.id })}
          text={a.toClose.text}
          href={scheduleHref(lang, { date: toClose.date, job: toClose.id })}
          action={a.toClose.action}
        />
      ) : null}
    </section>
  );
}

