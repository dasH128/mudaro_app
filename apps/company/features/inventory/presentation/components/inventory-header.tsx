import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDate } from "@/app/lib/format";
import type { InventoryText } from "../inventory-text";
import type { InventoryOrder } from "./inventory-editor";

type Props = { t: InventoryText; order: InventoryOrder; exitHref: string };

export function InventoryHeader({ t, order, exitHref }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
          {interpolate(t.title, { name: order.clientName })}
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="inline-flex h-6.5 items-center gap-1.5 rounded-full bg-status-config-surface px-2.5 text-xs font-bold text-foreground">
            <Icon name="phone" size={14} />
            {t.filledBy}
          </span>
          <span>
            {order.origin} <span aria-hidden="true">→</span> {order.destination} · {formatDate(order.date)}
            {order.linkLocked ? ` · ${t.linkLocked}` : ""}
          </span>
        </p>
      </div>
      <Link
        href={exitHref}
        className="inline-flex h-11 items-center rounded-full border border-field-border bg-surface px-4.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {t.saveAndExit}
      </Link>
    </header>
  );
}
