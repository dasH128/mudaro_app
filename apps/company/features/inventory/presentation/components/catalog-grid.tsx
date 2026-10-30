import { Icon } from "@/app/components/app-icon";
import { interpolate } from "@/app/i18n/interpolate";
import { formatVolume } from "@/app/lib/format";
import type { CatalogItem } from "../../domain/types";
import type { InventoryText } from "../inventory-text";

type Props = {
  t: InventoryText;
  title: string;
  items: readonly CatalogItem[];
  quantities: Readonly<Record<string, number>>;
  query: string;
  onQuery: (query: string) => void;
  onChange: (id: string, quantity: number) => void;
};

const roundButton =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function CatalogGrid({ t, title, items, quantities, query, onQuery, onChange }: Props) {
  const c = t.catalog;

  return (
    <section
      aria-labelledby="inventory-catalog"
      className="flex min-w-0 flex-[999_1_420px] flex-col gap-4 rounded-[20px] border border-line bg-surface p-5.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="inventory-catalog" className="font-display text-[22px] font-extrabold">
          {title}
        </h2>
        <label className="flex h-11 max-w-90 flex-[1_1_260px] items-center gap-2.5 rounded-full border border-field-border px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
          <Icon name="search" size={16} className="text-muted" />
          <span className="sr-only">{c.searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={c.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-field-placeholder"
          />
        </label>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]">
        {items.map((item) => {
          const quantity = quantities[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className={`flex min-h-40 flex-col gap-2 rounded-2xl p-4 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                quantity > 0 ? "border-2 border-foreground bg-surface" : "border border-line-soft bg-surface-soft"
              }`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-sm leading-snug font-bold">{item.name}</span>
                {quantity > 0 ? (
                  <span className="inline-flex h-6.5 min-w-6.5 items-center justify-center rounded-full bg-foreground px-1.5 text-[13px] font-bold text-background">
                    {quantity}
                  </span>
                ) : null}
              </span>
              <span className="text-[13px] text-muted">{interpolate(c.perUnit, { volume: formatVolume(item.volumeM3) })}</span>
              <span className="flex min-h-5.5 flex-wrap gap-1">
                {item.flags.map((flag) => (
                  <span key={flag} className="inline-flex h-5.5 items-center rounded-full bg-background px-2 text-[11px] font-bold">
                    {c.flags[flag]}
                  </span>
                ))}
              </span>
              <span className="mt-auto flex items-center justify-between gap-1.5">
                {quantity > 0 ? (
                  <button
                    type="button"
                    aria-label={interpolate(c.removeOne, { name: item.name })}
                    onClick={() => onChange(item.id, quantity - 1)}
                    className={`${roundButton} w-9 flex-none border border-status-off-border bg-surface text-foreground`}
                  >
                    <Icon name="minus" size={16} strokeWidth={2.4} />
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={interpolate(c.addOne, { name: item.name })}
                  onClick={() => onChange(item.id, quantity + 1)}
                  className={`${roundButton} flex-1 px-3 ${quantity > 0 ? "bg-background text-foreground" : "bg-foreground text-background"}`}
                >
                  <Icon name="plus" size={16} strokeWidth={2.4} />
                  {quantity > 0 ? c.more : c.add}
                </button>
              </span>
            </div>
          );
        })}

        {/* TODO(diseño): sin flujo diseñado para el objeto libre */}
        <button
          type="button"
          disabled
          className="flex min-h-40 flex-col items-start justify-center gap-1.5 rounded-2xl border-2 border-dashed border-accent bg-surface-soft p-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-status-config-surface">
            <Icon name="plus" size={18} strokeWidth={2.2} />
          </span>
          <span className="text-sm font-bold">{c.custom.title}</span>
          <span className="text-[13px] text-muted">{c.custom.text}</span>
        </button>
      </div>

      {items.length === 0 ? <p className="text-sm text-muted">{c.noResults}</p> : null}
    </section>
  );
}
