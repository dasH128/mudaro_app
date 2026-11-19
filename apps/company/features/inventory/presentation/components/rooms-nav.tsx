import { Icon } from "@/app/components/app-icon";
import type { CatalogRoom } from "../../domain/types";
import type { InventoryText } from "../inventory-text";

type Props = {
  t: InventoryText;
  /** Divisiones del catálogo de Mudaro, con el nombre ya traducido. */
  rooms: readonly CatalogRoom[];
  current: string;
  /** Objetos con cantidad por división (slug). */
  counts: Readonly<Record<string, number>>;
  onPick: (room: string) => void;
};

export function RoomsNav({ t, rooms, current, counts, onPick }: Props) {
  return (
    <nav
      aria-label={t.rooms.label}
      className="flex max-w-60 flex-[1_1_200px] flex-col gap-1 rounded-[20px] border border-line bg-surface p-3"
    >
      <span className="px-2.5 pt-1.5 pb-2 text-xs font-bold tracking-[0.16em] text-muted uppercase">{t.rooms.label}</span>
      {rooms.map(({ slug, name }) => {
        const selected = slug === current;
        const count = counts[slug] ?? 0;
        return (
          <button
            key={slug}
            type="button"
            aria-current={selected ? "true" : undefined}
            onClick={() => onPick(slug)}
            className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              selected ? "bg-foreground font-bold text-background" : "font-medium text-foreground hover:bg-surface-soft"
            }`}
          >
            <span className="flex-1 text-left">{name}</span>
            <span
              className={`inline-flex h-6 min-w-6.5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                selected ? "bg-background/20" : count > 0 ? "bg-background" : "text-muted"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
      {/* TODO(diseño): sin flujo diseñado para añadir divisiones propias */}
      <button
        type="button"
        disabled
        className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-dashed border-accent px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon name="plus" size={16} strokeWidth={2.2} />
        {t.rooms.add}
      </button>
    </nav>
  );
}
