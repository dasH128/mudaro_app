import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { pluralize } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { ClientSummaryCounts } from "../../domain/clients";
import type { ClientsText } from "../clients-text";
import { focusRing } from "./clients-parts";

type Props = { lang: Locale; t: ClientsText; counts: ClientSummaryCounts };

const chip = "inline-flex h-8.5 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px]";

export function ClientsHeader({ lang, t, counts }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{t.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8.5 items-center gap-2 rounded-full bg-foreground px-3.5 text-sm text-background">
            <strong className="font-display text-[17px]">{counts.all}</strong> {pluralize(lang, counts.all, t.summary.total)}
          </span>
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-foreground" />
            <strong>{counts.negotiating}</strong> {t.summary.negotiating}
          </span>
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            <strong>{counts.scheduled}</strong> {t.summary.scheduled}
          </span>
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-success-dot" />
            <strong>{counts.returned}</strong> {t.summary.returned}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {/* Los clientes nacen al crear un pedido: el alta lleva al formulario de pedidos */}
        <Link
          href={localePath(lang, ROUTES.orders.new)}
          className={`flex h-12 items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground shadow-md ${focusRing}`}
        >
          <Icon name="plus" size={18} strokeWidth={2.5} />
          {t.newOrder}
        </Link>
        <span className="text-xs text-muted">{t.createHint}</span>
      </div>
    </header>
  );
}
