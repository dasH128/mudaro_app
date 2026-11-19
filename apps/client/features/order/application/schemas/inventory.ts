import { z } from "zod";

import { ACCESS_LIMITS, EXTRA_NOTE_MAX, LIFT_SIZES, isAccessComplete, type DraftChanges } from "@mudaro/inventory";

import { isLinkToken, type ClientError } from "@/features/order/domain/types";

// Lo que envía el cliente al guardar o al enviar (RF-19 a RF-26). Se valida en servidor aunque el navegador ya lo
// compruebe; la Edge Function y la base de datos lo vuelven a comprobar. Mismas reglas que la app de la empresa.

const MAX_LINES = 500;
const MAX_EXTRAS = 50;
/** Origen, hasta 3 paradas y destino. */
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
  token: z.string().refine(isLinkToken),
  lines: z
    .array(
      z.object({
        room: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
        itemId: z.uuid(),
        quantity: z.number().int().min(0).max(999),
      }),
    )
    .max(MAX_LINES),
  access: z.array(access).max(MAX_POINTS),
  extras: z.array(z.object({ id: z.uuid(), note: z.string().max(EXTRA_NOTE_MAX) })).max(MAX_EXTRAS),
});

export type ClientInventoryPayload = z.input<typeof schema>;

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
 * - `save`: los accesos a medias no se guardan (se quedan en pantalla): la base pondría valores por defecto que
 *   parecerían respuestas.
 * - `submit`: todos los accesos son obligatorios (RF-23) y tiene que haber al menos un objeto.
 */
export function parseClientInventory(
  input: unknown,
  mode: "save" | "submit",
): { ok: true; token: string; changes: DraftChanges } | { ok: false; error: ClientError } {
  const result = schema.safeParse(input);
  if (!result.success) return { ok: false, error: "invalid" };
  const value = result.data;

  const lines = value.lines.filter((line) => line.quantity > 0);
  if (mode === "submit") {
    if (lines.length === 0) return { ok: false, error: "empty" };
    if (value.access.length === 0 || !value.access.every(isAccessComplete)) return { ok: false, error: "accessIncomplete" };
  }

  return {
    ok: true,
    token: value.token,
    changes: {
      lines: lines.map((line) => ({ catalogItemId: line.itemId, room: line.room, quantity: line.quantity })),
      addresses: value.access.filter(isAccessComplete).map(addressOf),
      extras: value.extras.map((extra) => ({ catalogExtraId: extra.id, note: extra.note.trim() })),
    },
  };
}
