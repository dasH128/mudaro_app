import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDateTime } from "@/app/lib/format";
import { accessFlags, type AddressAccess, type OrderEvent } from "../domain/detail";
import type { OrdersText } from "./orders-text";

/** "2.º" o "R/C". */
export function floorLabel(floor: number, t: OrdersText["detail"]["addresses"]): string {
  return floor === 0 ? t.groundFloor : interpolate(t.floorValue, { n: floor });
}

export type AccessChip = { label: string; tone: "warn" | "ok" };

/** Resumen de accesos en chips: lo que complica el trabajo va en aviso. */
export function accessChips(access: AddressAccess, t: OrdersText["detail"]["addresses"]): AccessChip[] {
  const flags = accessFlags(access);
  const floor = floorLabel(access.floor, t);
  const floorChip: AccessChip = flags.noLift
    ? { label: interpolate(t.chips.noLift, { floor }), tone: "warn" }
    : access.lift === "small"
      ? { label: interpolate(t.chips.smallLift, { floor }), tone: "ok" }
      : access.lift === "normal"
        ? { label: interpolate(t.chips.lift, { floor }), tone: "ok" }
        : { label: interpolate(t.chips.floorOnly, { floor }), tone: "ok" };

  return [
    floorChip,
    ...(flags.narrowStairs ? [{ label: t.chips.narrowStairs, tone: "warn" } as const] : []),
    { label: interpolate(t.chips.parking, { meters: access.parkingMeters }), tone: flags.farParking ? "warn" : "ok" },
    ...(flags.parkingPermit ? [{ label: t.chips.permit, tone: "warn" } as const] : []),
  ];
}

export type AccessFact = { label: string; value: string; warn: boolean };

/** Datos de acceso en pares etiqueta-valor para la pestaña Moradas. */
export function accessFacts(access: AddressAccess, t: OrdersText): AccessFact[] {
  const a = t.detail.addresses;
  const flags = accessFlags(access);
  return [
    { label: a.floor, value: floorLabel(access.floor, a), warn: false },
    { label: a.lift, value: t.inventory.access.lifts[access.lift], warn: flags.noLift },
    { label: a.narrowStairs, value: access.narrowStairs ? a.yes : a.no, warn: flags.narrowStairs },
    { label: a.parking, value: interpolate(a.parkingAt, { meters: access.parkingMeters }), warn: flags.farParking },
    { label: a.permit, value: access.needsParkingPermit ? a.needsPermit : a.noPermit, warn: flags.parkingPermit },
  ];
}

export type EventText = { title: string; meta: string; tone: "primary" | "ink" | "accent" };

/** Título y detalle de un evento del historial. */
export function describeEvent(event: OrderEvent, t: OrdersText, locale: Locale): EventText {
  const h = t.detail.history;
  const when = formatDateTime(event.at);
  switch (event.kind) {
    case "created": {
      const source = event.source ? interpolate(t.detail.meta.source, { source: t.new.move.sources[event.source] }) : null;
      return {
        title: h.created,
        meta: [interpolate(h.createdMeta, { when, actor: event.actor }), source].filter(Boolean).join(" · "),
        tone: "ink",
      };
    }
    case "note-added":
      return { title: h.noteAdded, meta: interpolate(h.meta, { when, actor: event.actor }), tone: "accent" };
    case "link-shared":
      return {
        title: h.linkShared,
        meta: `${interpolate(h.meta, { when, actor: event.actor })} · ${pluralize(locale, event.validityDays, h.validFor)}`,
        tone: "ink",
      };
    case "inventory-submitted":
      return {
        title: interpolate(h.inventorySubmitted, { version: event.version }),
        meta: interpolate(h.inventoryMeta, { when }),
        tone: "primary",
      };
    case "proposal-sent":
      return {
        title: interpolate(h.proposalSent, { version: event.version }),
        meta: interpolate(h.meta, { when, actor: event.actor }),
        tone: "primary",
      };
    case "won":
      return { title: h.won, meta: when, tone: "primary" };
    case "lost":
      return { title: h.lost, meta: event.reason ? `${when} · ${event.reason}` : when, tone: "ink" };
  }
}
