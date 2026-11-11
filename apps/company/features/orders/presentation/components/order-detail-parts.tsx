import { interpolate } from "@/app/i18n/interpolate";
import type { DetailAddress } from "../../domain/detail";

/** Tarjeta blanca de una sección del detalle. */
export const card = "flex flex-col rounded-[20px] border border-line bg-surface p-6";
export const sectionTitle = "font-display text-[22px] font-extrabold";
/** Botón o enlace secundario pequeño. */
export const ghostButton =
  "inline-flex h-9 items-center rounded-full border border-field-border bg-surface px-3.5 text-[13px] font-bold text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Letra A (origen), B (destino) o P1, P2... (paradas, con borde discontinuo). */
export function AddressBadge({ address }: { address: Pick<DetailAddress, "role" | "stopNumber"> }) {
  const style = {
    origin: "bg-foreground text-background",
    destination: "bg-primary text-primary-foreground",
    stop: "border-2 border-dashed border-accent bg-surface-head text-foreground",
  }[address.role];
  const text = address.role === "origin" ? "A" : address.role === "destination" ? "B" : `P${address.stopNumber ?? ""}`;
  return (
    <span aria-hidden="true" className={`grid size-9 flex-none place-items-center rounded-xl text-sm font-bold ${style}`}>
      {text}
    </span>
  );
}

/** Nombre de la dirección en el recorrido: "Origem", "Paragem 1" o "Destino". */
export function addressKind(address: Pick<DetailAddress, "role" | "stopNumber">, labels: { origin: string; destination: string; stop: string }) {
  if (address.role === "origin") return labels.origin;
  if (address.role === "destination") return labels.destination;
  return interpolate(labels.stop, { n: String(address.stopNumber ?? "") });
}
