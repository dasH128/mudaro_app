import Link from "next/link";

import { Icon, type IconName } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { pluralize } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { FleetAlerts } from "../../domain/fleet";
import { fleetHref } from "../fleet-href";
import type { FleetText } from "../fleet-text";
import { focusRing } from "./fleet-parts";

type Props = {
  lang: Locale;
  t: FleetText;
  alerts: FleetAlerts;
  /** El coste por km solo lo ve el administrador (RNF-03): sin él no se avisa de que falta. */
  showCost: boolean;
};

type CardProps = {
  icon: IconName;
  title: string;
  text: string;
  href: string;
  action: string;
  tone: "ink" | "soft" | "warn";
};

const TONES = {
  ink: { card: "border-line bg-surface", tile: "bg-foreground text-background", text: "text-muted", link: "text-foreground" },
  soft: { card: "border-line bg-surface", tile: "bg-status-config-surface text-foreground", text: "text-muted", link: "text-foreground" },
  warn: {
    card: "border-warn-border bg-warn-surface",
    tile: "bg-warn-border/30 text-warn-foreground",
    text: "text-warn-foreground",
    link: "text-warn-foreground",
  },
} as const;

function AlertCard({ icon, title, text, href, action, tone }: CardProps) {
  const look = TONES[tone];
  return (
    <article className={`flex gap-3.5 rounded-[20px] border px-4.5 py-4 ${look.card}`}>
      <span aria-hidden className={`grid size-10 flex-none place-items-center rounded-xl ${look.tile}`}>
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

/** Tres avisos de la frota, solo los que aplican. */
export function FleetAlertsSection({ lang, t, alerts, showCost }: Props) {
  const { extraTripProposals, idle, missingCost } = alerts;
  const a = t.alerts;
  if (extraTripProposals === 0 && !idle && !(showCost && missingCost)) return null;

  return (
    <section aria-label={a.label} className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
      {extraTripProposals > 0 ? (
        <AlertCard
          icon="orders"
          tone="ink"
          title={pluralize(lang, extraTripProposals, a.capacity.title)}
          text={a.capacity.text}
          href={localePath(lang, ROUTES.proposals.list)}
          action={a.capacity.action}
        />
      ) : null}
      {idle ? (
        <AlertCard
          icon="clock"
          tone="soft"
          title={pluralize(lang, idle.days, a.idle.title, { name: idle.vehicle.name })}
          text={pluralize(lang, idle.vehicle.proposals30d.total, a.idle.text)}
          href={fleetHref(lang, { vehicle: idle.vehicle.id })}
          action={a.idle.action}
        />
      ) : null}
      {showCost && missingCost ? (
        <AlertCard
          icon="alert"
          tone="warn"
          title={pluralize(lang, missingCost.count, a.cost.title)}
          text={a.cost.text}
          href={fleetHref(lang, { vehicle: missingCost.first.id })}
          action={a.cost.action}
        />
      ) : null}
    </section>
  );
}
