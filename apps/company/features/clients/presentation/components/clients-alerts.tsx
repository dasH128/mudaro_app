import Link from "next/link";

import { Icon, type IconName } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDayMonth } from "@/app/lib/format";
import type { ClientAlerts } from "../../domain/clients";
import { clientsHref } from "../clients-href";
import type { ClientsText } from "../clients-text";
import { focusRing } from "./clients-parts";

type Props = { lang: Locale; t: ClientsText; alerts: ClientAlerts };

type CardProps = { icon: IconName; title: string; text: string; href: string; action: string; tone: "warn" | "soft" | "success" };

const TONES = {
  warn: { card: "border-warn-border bg-warn-surface", tile: "bg-warn-border/30 text-warn-foreground", text: "text-warn-foreground", link: "text-warn-foreground" },
  soft: { card: "border-line bg-surface", tile: "bg-status-config-surface text-foreground", text: "text-muted", link: "text-foreground" },
  success: { card: "border-line bg-surface", tile: "bg-success-surface text-success-foreground", text: "text-muted", link: "text-foreground" },
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

/** Tres avisos de clientes, solo los que aplican. */
export function ClientsAlertsSection({ lang, t, alerts }: Props) {
  const { missingTaxId, duplicate, returned } = alerts;
  const a = t.alerts;
  if (!missingTaxId && !duplicate && returned.length === 0) return null;

  return (
    <section aria-label={a.label} className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
      {missingTaxId ? (
        <AlertCard
          icon="alert"
          tone="warn"
          title={interpolate(a.taxId.title, { name: missingTaxId.client.name })}
          text={interpolate(a.taxId.text, { date: formatDayMonth(missingTaxId.moveOn) })}
          href={clientsHref(lang, { client: missingTaxId.client.id })}
          action={a.taxId.action}
        />
      ) : null}
      {duplicate?.duplicate ? (
        <AlertCard
          icon="clients"
          tone="soft"
          title={a.duplicate.title}
          text={interpolate(a.duplicate.text, { first: duplicate.name, second: duplicate.duplicate.name })}
          href={clientsHref(lang, { client: duplicate.id })}
          action={a.duplicate.action}
        />
      ) : null}
      {returned.length > 0 ? (
        <AlertCard
          icon="history"
          tone="success"
          title={pluralize(lang, returned.length, a.returned.title)}
          text={pluralize(lang, returned.length, a.returned.text, {
            names: new Intl.ListFormat(lang, { style: "long", type: "conjunction" }).format(returned.slice(0, 2).map((c) => c.name)),
          })}
          href={clientsHref(lang, { filter: "returned" })}
          action={a.returned.action}
        />
      ) : null}
    </section>
  );
}
