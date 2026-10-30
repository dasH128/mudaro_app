import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDateTime, formatVolume } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import { summarizeInventory, summarizeLines, type InventoryLine, type OrderDetail } from "../../domain/detail";
import type { OrdersText } from "../orders-text";
import { card, ghostButton, sectionTitle } from "./order-detail-parts";

function LineRow({ t, line }: { t: OrdersText; line: InventoryLine }) {
  const d = t.detail.inventory;
  const missing = line.volumeM3 === null;
  const tags = [
    ...line.flags.map((flag) => t.inventory.catalog.flags[flag]),
    ...(line.free ? [d.free] : []),
  ];

  return (
    <li
      className={`flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-t border-line-soft px-4 py-3 text-sm ${
        missing ? "bg-warn-surface" : "hover:bg-surface-soft"
      }`}
    >
      <span className="w-8.5 text-right font-bold text-muted">{line.quantity}×</span>
      <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
        <span className="font-medium">{line.name}</span>
        {missing ? <span className="text-xs font-bold text-warn-foreground">{d.noMeasures}</span> : null}
      </span>
      <span className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex h-6 items-center rounded-full bg-background px-2.25 text-xs font-bold">
            {tag}
          </span>
        ))}
      </span>
      {line.hasPhoto ? (
        <span role="img" aria-label={d.photo} className="grid size-9 place-items-center rounded-[10px] bg-status-config-surface text-muted">
          <Icon name="camera" size={16} />
        </span>
      ) : null}
      <span className="w-17.5 text-right font-bold">{line.volumeM3 === null ? "?" : formatVolume(line.volumeM3)}</span>
    </li>
  );
}

type Props = { lang: Locale; t: OrdersText; order: OrderDetail };

/** Pestaña Inventário: lo que declaró el cliente, división a división. */
export function OrderInventoryTab({ lang, t, order }: Props) {
  const d = t.detail.inventory;
  const s = t.detail.summary;
  const { inventory } = order;
  const inventoryHref = localePath(lang, ROUTES.orders.inventory(order.id));

  if (!inventory) {
    return (
      <div role="status" className={`${card} items-center gap-3 px-6 py-10 text-center`}>
        <h2 className={sectionTitle}>{d.emptyTitle}</h2>
        <p className="max-w-105 text-[15px] text-muted">{d.emptyText}</p>
        <Link href={inventoryHref} className={ghostButton}>
          {d.fill}
        </Link>
      </div>
    );
  }

  const totals = summarizeInventory(inventory);
  const meta = interpolate(d.meta, {
    filledBy: inventory.filledBy === "link" ? d.byClient : d.byCompany,
    when: formatDateTime(inventory.submittedAt),
    items: pluralize(lang, totals.items, s.items),
    volume: formatVolume(totals.volumeM3),
  });

  return (
    <section aria-labelledby="inventory" className={`${card} gap-4.5`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-col gap-1">
          <h2 id="inventory" className={sectionTitle}>
            {interpolate(d.title, { version: inventory.version })}
          </h2>
          <span className="text-sm text-muted">{meta}</span>
        </div>
        <Link href={inventoryHref} className={`${ghostButton} h-10 px-4 text-sm`}>
          {d.edit}
        </Link>
      </div>

      {inventory.rooms.map(({ room, lines }) => {
        const part = summarizeLines(lines);
        const summary =
          interpolate(d.roomSummary, { items: pluralize(lang, part.items, s.items), volume: formatVolume(part.volumeM3) }) +
          (part.missingMeasures > 0 ? interpolate(d.roomMissing, { count: part.missingMeasures }) : "");
        return (
          <div key={room} className="overflow-hidden rounded-2xl border border-line-soft">
            <div className="flex items-center justify-between gap-2.5 bg-surface-head px-4 py-3">
              <h3 className="font-bold">{t.inventory.rooms.names[room]}</h3>
              <span className="text-[13px] text-muted">{summary}</span>
            </div>
            <ul>
              {lines.map((line) => (
                <LineRow key={line.name} t={t} line={line} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
