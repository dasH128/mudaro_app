import type { DetailAddress } from "../../domain/detail";

/** Tarjeta blanca de una sección del detalle. */
export const card = "flex flex-col rounded-[20px] border border-line bg-surface p-6";
export const sectionTitle = "font-display text-[22px] font-extrabold";
/** Botón o enlace secundario pequeño. */
export const ghostButton =
  "inline-flex h-9 items-center rounded-full border border-field-border bg-surface px-3.5 text-[13px] font-bold text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Letra A (origen) o B (destino). */
export function AddressBadge({ role }: { role: DetailAddress["role"] }) {
  const origin = role === "origin";
  return (
    <span
      aria-hidden="true"
      className={`grid size-9 flex-none place-items-center rounded-xl text-sm font-bold ${
        origin ? "bg-foreground text-background" : "bg-primary text-primary-foreground"
      }`}
    >
      {origin ? "A" : "B"}
    </span>
  );
}
