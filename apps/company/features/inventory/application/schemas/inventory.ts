import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";
import {
  ACCESS_LIMITS,
  EXTRA_NOTE_MAX,
  LIFT_SIZES,
  isAccessComplete,
  type DraftChanges,
  type InventoryError,
} from "@/features/inventory/domain/types";

// Lo que envía la pantalla Inventário al guardar o al concluir (RF-19 a RF-26). Se valida en servidor aunque el
// navegador ya lo compruebe, y la base de datos lo vuelve a comprobar en save_inventory_draft().
// Los errores son códigos (`InventoryError`): la pantalla los traduce.

const MAX_LINES = 500;
const MAX_EXTRAS = 50;
/** Origen, hasta 3 paradas (MAX_STOPS) y destino. */
const MAX_POINTS = 5;

const access = z.object({
  addressId: z.uuid(),
  floor: z.string().max(10),
  parkingMeters: z.string().max(10),
  lift: z.enum(LIFT_SIZES).nullable(),
  narrowStairs: z.boolean(),
  needsParkingPermit: z.boolean(),
  notes: z.string().max(ACCESS_LIMITS.notesMax),
});

const schema = z.object({
  lang: z.enum(LOCALES),
  /** Número visible del pedido (MD-0836). El repo lo traduce al id con RLS: nunca se confía en un uuid del navegador. */
  orderId: z.string().min(1).max(20),
  lines: z
    .array(
      z.object({
        room: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
        itemId: z.uuid(),
        quantity: z.number().int().min(0).max(999),
      }),
    )
    .max(MAX_LINES)
    .optional(),
  access: z.array(access).max(MAX_POINTS).optional(),
  extras: z
    .array(z.object({ id: z.uuid(), note: z.string().max(EXTRA_NOTE_MAX) }))
    .max(MAX_EXTRAS)
    .optional(),
});

export type InventoryPayload = z.input<typeof schema>;

export type ParsedInventory = { lang: (typeof LOCALES)[number]; orderId: string; changes: DraftChanges };

type AccessInput = z.infer<typeof access>;

function addressOf(point: AccessInput): NonNullable<DraftChanges["addresses"]>[number] {
  return {
    addressId: point.addressId,
    floor: Number(point.floor.trim()),
    // isAccessComplete garantiza que no es nulo
    lift: point.lift ?? "none",
    narrowStairs: point.narrowStairs,
    parkingMeters: Number(point.parkingMeters.trim()),
    needsParkingPermit: point.needsParkingPermit,
    notes: point.notes.trim(),
  };
}

/**
 * Valida lo que llega del navegador.
 * - `save`: guardar al cambiar de paso o al salir. Los accesos a medias no se guardan (se quedan en pantalla), porque
 *   la base de datos pondría valores por defecto que parecerían respuestas.
 * - `submit`: concluir. Todos los accesos son obligatorios (RF-23) y tiene que haber al menos un objeto.
 */
export function parseInventory(
  input: unknown,
  mode: "save" | "submit",
): { ok: true; data: ParsedInventory } | { ok: false; error: InventoryError } {
  const result = schema.safeParse(input);
  if (!result.success) return { ok: false, error: "invalid" };
  const value = result.data;

  const lines = value.lines?.filter((line) => line.quantity > 0);
  const points = value.access;

  if (mode === "submit") {
    if (!lines || lines.length === 0) return { ok: false, error: "empty" };
    if (!points || points.length === 0 || !points.every(isAccessComplete)) return { ok: false, error: "accessIncomplete" };
  }

  return {
    ok: true,
    data: {
      lang: value.lang,
      orderId: value.orderId,
      changes: {
        lines: lines?.map((line) => ({ catalogItemId: line.itemId, room: line.room, quantity: line.quantity })),
        addresses: points?.filter(isAccessComplete).map(addressOf),
        extras: value.extras?.map((extra) => ({ catalogExtraId: extra.id, note: extra.note.trim() })),
      },
    },
  };
}
