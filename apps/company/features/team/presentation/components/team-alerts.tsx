import Link from "next/link";

import { Icon, type IconName } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDayMonth } from "@/app/lib/format";
import { daysBetween } from "@/features/fleet/domain/fleet";
import { firstName } from "@/features/orders/domain/client-name";
import type { TeamAlerts } from "../../domain/team";
import { teamHref } from "../team-href";
import type { TeamText } from "../team-text";
import { focusRing } from "./team-parts";

type Props = { lang: Locale; t: TeamText; alerts: TeamAlerts; today: string };

type CardProps = {
  icon: IconName;
  title: string;
  text: string;
  tone: "warn" | "ink" | "soft";
  /** Enlace al panel o, sin destino todavía (la agenda no existe), un texto desactivado. */
  action: { label: string; href?: string; soon?: string };
};

const TONES = {
  warn: {
    card: "border-warn-border bg-warn-surface",
    tile: "bg-primary text-primary-foreground",
    text: "text-warn-foreground",
    link: "text-warn-foreground",
  },
  ink: { card: "border-line bg-surface", tile: "bg-foreground text-background", text: "text-muted", link: "text-foreground" },
  soft: { card: "border-line bg-surface", tile: "bg-status-config-surface text-foreground", text: "text-muted", link: "text-foreground" },
} as const;

function AlertCard({ icon, title, text, tone, action }: CardProps) {
  const look = TONES[tone];
  return (
    <article className={`flex gap-3.5 rounded-[20px] border px-4.5 py-4 ${look.card}`}>
      <span aria-hidden className={`grid size-10 flex-none place-items-center rounded-xl ${look.tile}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className={`flex flex-col gap-1 text-sm leading-snug ${tone === "warn" ? look.text : ""}`}>
        <strong>{title}</strong>
        <span className={look.text}>{text}</span>
        {action.href ? (
          <Link href={action.href} scroll={false} className={`text-[13px] font-bold underline ${look.link} ${focusRing}`}>
            {action.label}
          </Link>
        ) : (
          <span title={action.soon} className={`cursor-not-allowed text-[13px] font-bold opacity-50 ${look.link}`}>
            {action.label}
          </span>
        )}
      </span>
    </article>
  );
}

const upperFirst = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

/** Tres avisos del equipo, solo los que aplican. */
export function TeamAlertsSection({ lang, t, alerts, today }: Props) {
  const { understaffed, expiringInvite, missingPhone } = alerts;
  const a = t.alerts;
  if (!understaffed && !expiringInvite && !missingPhone) return null;

  let staffing: CardProps | null = null;
  if (understaffed) {
    const missing = understaffed.needed - understaffed.assigned;
    const when = daysBetween(today, understaffed.date) === 1 ? a.staffing.tomorrow : interpolate(a.staffing.onDate, { date: formatDayMonth(understaffed.date) });
    const names = new Intl.ListFormat(lang, { style: "long", type: "conjunction" }).format(understaffed.free.map((m) => firstName(m.name)));
    const text = pluralize(lang, understaffed.assigned, a.staffing.text, { needed: understaffed.needed, assigned: understaffed.assigned });
    staffing = {
      icon: "userMinus",
      tone: "warn",
      title: pluralize(lang, missing, a.staffing.title, { when: upperFirst(when), orderId: understaffed.orderId }),
      text: understaffed.free.length > 0 ? `${text} ${interpolate(a.staffing.free, { when, names })}` : text,
      action: { label: a.staffing.action, soon: t.soon },
    };
  }

  let invite: CardProps | null = null;
  if (expiringInvite) {
    const days = daysBetween(today, expiringInvite.invite.expiresOn);
    const when =
      days === 0
        ? a.invite.today
        : days === 1
          ? a.invite.tomorrow
          : interpolate(a.invite.onDate, { date: formatDayMonth(expiringInvite.invite.expiresOn) });
    invite = {
      icon: "mail",
      tone: "ink",
      title: interpolate(a.invite.title, { name: firstName(expiringInvite.invite.name), when }),
      text: pluralize(lang, expiringInvite.sentDaysAgo, a.invite.text),
      action: { label: a.invite.action, href: teamHref(lang, { person: expiringInvite.invite.id }) },
    };
  }

  return (
    <section aria-label={a.label} className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
      {staffing ? <AlertCard {...staffing} /> : null}
      {invite ? <AlertCard {...invite} /> : null}
      {missingPhone ? (
        <AlertCard
          icon="smartphone"
          tone="soft"
          title={interpolate(a.phone.title, { name: missingPhone.name })}
          text={a.phone.text}
          action={{ label: a.phone.action, href: teamHref(lang, { person: missingPhone.id }) }}
        />
      ) : null}
    </section>
  );
}
