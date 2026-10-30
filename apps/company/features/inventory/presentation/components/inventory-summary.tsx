import { Icon } from "@/app/components/app-icon";
import { formatDecimal, formatVolume } from "@/app/lib/format";
import type { CatalogItem, InventorySummary as Totals } from "../../domain/types";
import type { InventoryText } from "../inventory-text";

type Props = {
  t: InventoryText;
  totals: Totals;
  /** Objetos de la división actual que ya llevan cantidad. */
  roomItems: readonly CatalogItem[];
  quantities: Readonly<Record<string, number>>;
};

export function InventorySummary({ t, totals, roomItems, quantities }: Props) {
  const s = t.summary;
  const stats = [
    { label: s.items, value: totals.items },
    { label: s.fragile, value: totals.fragile },
    { label: s.dismantle, value: totals.dismantle },
  ];

  return (
    <aside aria-label={s.title} className="flex max-w-80 flex-[1_1_260px] flex-col gap-4">
      <section className="flex flex-col gap-3.5 rounded-[20px] bg-sidebar p-5.5 text-white">
        <h2 className="text-sm font-bold text-on-ink">{s.title}</h2>
        <p className="flex items-baseline gap-2">
          <span className="font-display text-[40px] leading-none font-extrabold">{formatDecimal(totals.volumeM3)}</span>
          <span className="text-base text-on-ink">m³</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <span key={stat.label} className="flex flex-col rounded-xl bg-white/[0.08] p-2.5">
              <strong className="text-lg">{stat.value}</strong>
              <span className="text-xs text-on-ink">{stat.label}</span>
            </span>
          ))}
        </div>
        <span className="text-xs text-on-ink">{s.declared}</span>
      </section>

      <section className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-surface p-4.5">
        <h3 className="text-[15px] font-bold">{s.thisRoom}</h3>
        {roomItems.length === 0 ? (
          <p className="text-sm text-muted">{s.roomEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {roomItems.map((item) => {
              const quantity = quantities[item.id] ?? 0;
              return (
                <li key={item.id} className="flex items-center gap-2.5 text-sm">
                  <span className="min-w-7 font-bold">{quantity}×</span>
                  <span className="flex-1">{item.name}</span>
                  <span className="text-muted">{formatVolume(quantity * item.volumeM3)}</span>
                </li>
              );
            })}
          </ul>
        )}
        {/* TODO(diseño): sin flujo diseñado para adjuntar fotos */}
        <button
          type="button"
          disabled
          className="inline-flex h-9 items-center gap-1.5 self-start text-[13px] font-bold underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="camera" size={16} />
          {s.addPhotos}
        </button>
      </section>
    </aside>
  );
}
