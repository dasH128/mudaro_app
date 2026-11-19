import { z } from "npm:zod@4.6.7";

import { createServiceClient } from "../_shared/platform-caller.ts";

// Web del cliente (apps/client, B9): el cliente no tiene cuenta y entra con el enlace del pedido (RF-15, RNF-02).
// Esta función es la única puerta entre su web y la base de datos:
//   - Recibe el token del enlace, calcula su hash SHA-256 y solo trabaja con el pedido que tiene ese hash.
//   - "get" devuelve lo que el cliente puede ver de su pedido, el catálogo y su borrador.
//   - "save" guarda el borrador y "submit" lo envía, con las funciones client_* de la base de datos.
// Se despliega sin verificación de JWT (el cliente no tiene sesión): el token del enlace es la autorización.
// Pendiente: limitar la frecuencia de peticiones por IP antes de abrir el piloto a clientes reales.

const LOCALES = ["pt", "es", "en"] as const;
type Locale = (typeof LOCALES)[number];

const TOKEN = z.string().regex(/^[0-9a-f]{64}$/);
const UUID = z.uuid();

const LINES = z
  .array(z.object({ catalogItemId: UUID, room: z.string().min(1).max(80), quantity: z.number().int().min(1).max(999) }))
  .max(500);

// Mismos límites que los `check` de inventory_addresses y que la app (ACCESS_LIMITS).
const ADDRESSES = z
  .array(
    z.object({
      addressId: UUID,
      floor: z.number().int().min(-5).max(99),
      lift: z.enum(["none", "small", "large"]),
      narrowStairs: z.boolean(),
      parkingDistanceM: z.number().int().min(0).max(10_000),
      needsPermit: z.boolean(),
      notes: z.string().max(1000),
    }),
  )
  .max(10);

const EXTRAS = z.array(z.object({ catalogExtraId: UUID, note: z.string().max(500) })).max(50);

const PAYLOAD = z.discriminatedUnion("action", [
  z.object({ action: z.literal("get"), token: TOKEN, locale: z.enum(LOCALES) }),
  z.object({
    action: z.literal("save"),
    token: TOKEN,
    lines: LINES.nullable(),
    addresses: ADDRESSES.nullable(),
    extras: EXTRAS.nullable(),
  }),
  // Al enviar, los accesos de todas las direcciones son obligatorios (RF-23): la base tiene valores por defecto que
  // parecerían una respuesta, así que se exigen aquí y la base comprueba que vienen todas.
  z.object({ action: z.literal("submit"), token: TOKEN, lines: LINES.min(1), addresses: ADDRESSES.min(1), extras: EXTRAS }),
]);

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

type Translation = { locale: string };

/** Texto en el idioma pedido o, si falta, en portugués (obligatorio en el catálogo). */
function pick<T extends Translation>(rows: readonly T[], locale: Locale): T | undefined {
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === "pt");
}

/** Mensaje de las funciones de la base de datos al código que entiende la web del cliente. */
function errorOf(message: string | undefined): { code: string; status: number } {
  switch (message) {
    case "link not found":
      return { code: "not_found", status: 404 };
    case "link expired":
      return { code: "expired", status: 410 };
    case "no draft inventory":
    case "a submitted inventory version cannot change":
      return { code: "no_draft", status: 409 };
    case "empty inventory":
      return { code: "empty", status: 422 };
    case "missing address":
      return { code: "access_incomplete", status: 422 };
    case "invalid payload":
    case "invalid line":
    case "duplicated line":
    case "duplicated extra":
    case "catalog item not found":
    case "catalog extra not found":
    case "address not found":
      return { code: "invalid_input", status: 400 };
    default:
      return { code: "internal_error", status: 500 };
  }
}

type Supabase = ReturnType<typeof createServiceClient>;

async function readOrder(supabase: Supabase, tokenHash: string, locale: Locale): Promise<Response> {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `id, contact_name, desired_date, date_flexibility, token_expires_at, cancelled_at,
       company:companies!orders_created_by_company_id_fkey(trade_name),
       addresses(id, role, sort_order),
       inventories(
         version, filled_by, submitted_at,
         inventory_addresses(address_id, address, floor, lift, narrow_stairs, parking_distance_m, needs_permit, notes),
         inventory_lines(catalog_item_id, room, quantity),
         inventory_extras(catalog_extra_id, note)
       )`,
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) {
    console.error("[client-order] read failed:", error.code);
    return json({ code: "internal_error" }, 500);
  }
  if (!order || order.cancelled_at) return json({ code: "not_found" }, 404);

  const [rooms, items, extras] = await Promise.all([
    supabase
      .from("catalog_rooms")
      .select("slug, translations:catalog_room_translations(locale, name)")
      .eq("active", true)
      .order("sort_order")
      .order("slug"),
    supabase
      .from("catalog_items")
      .select("id, volume_m3, handling_flags, translations:catalog_item_translations(locale, name), rooms:catalog_item_rooms(room:catalog_rooms(slug))")
      .eq("active", true)
      .order("sort_order")
      .order("slug"),
    supabase
      .from("catalog_extras")
      .select("id, translations:catalog_extra_translations(locale, name, description)")
      .eq("active", true)
      .order("sort_order")
      .order("slug"),
  ]);
  if (rooms.error || items.error || extras.error) {
    console.error("[client-order] catalog read failed");
    return json({ code: "internal_error" }, 500);
  }

  const inventories = [...order.inventories].sort((a, b) => b.version - a.version);
  const draft = inventories.find((inventory) => inventory.submitted_at === null) ?? null;
  const lastSubmitted = inventories.find((inventory) => inventory.submitted_at !== null) ?? null;
  const company = Array.isArray(order.company) ? order.company[0] : order.company;

  // Solo lo que el cliente necesita: nada de la empresa salvo su nombre, ni ids internos del envío.
  return json(
    {
      order: {
        companyName: company?.trade_name ?? "",
        contactName: order.contact_name,
        desiredDate: order.desired_date,
        dateFlexibility: order.date_flexibility,
        expiresAt: order.token_expires_at,
        expired: order.token_expires_at !== null && new Date(order.token_expires_at) <= new Date(),
        addresses: [...order.addresses].sort((a, b) => a.sort_order - b.sort_order).map((a) => ({ id: a.id, role: a.role })),
      },
      draft: draft
        ? {
            version: draft.version,
            addresses: draft.inventory_addresses,
            lines: draft.inventory_lines,
            extras: draft.inventory_extras,
          }
        : null,
      submitted: lastSubmitted ? { version: lastSubmitted.version, submittedAt: lastSubmitted.submitted_at } : null,
      catalog: {
        rooms: rooms.data.flatMap((row) => {
          const text = pick(row.translations, locale);
          return text ? [{ slug: row.slug, name: text.name }] : [];
        }),
        items: items.data.flatMap((row) => {
          const text = pick(row.translations, locale);
          if (!text) return [];
          return [
            {
              id: row.id,
              name: text.name,
              volumeM3: Number(row.volume_m3),
              flags: row.handling_flags,
              rooms: row.rooms.flatMap((link: { room: { slug: string } | null }) => (link.room ? [link.room.slug] : [])),
            },
          ];
        }),
        extras: extras.data.flatMap((row) => {
          const text = pick(row.translations, locale);
          return text ? [{ id: row.id, name: text.name, description: text.description }] : [];
        }),
      },
    },
    200,
  );
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const parsed = PAYLOAD.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ code: "invalid_input" }, 400);
  const input = parsed.data;

  const supabase = createServiceClient();
  const tokenHash = await sha256Hex(input.token);

  if (input.action === "get") return readOrder(supabase, tokenHash, input.locale);

  const { error: saveError } = await supabase.rpc("client_save_inventory_draft", {
    p_token_hash: tokenHash,
    p_lines: input.lines,
    p_addresses: input.addresses,
    p_extras: input.extras,
  });
  if (saveError) {
    const mapped = errorOf(saveError.message);
    if (mapped.status === 500) console.error("[client-order] save failed:", saveError.code);
    return json({ code: mapped.code }, mapped.status);
  }
  if (input.action === "save") return json({ ok: true }, 200);

  const { data: version, error: submitError } = await supabase.rpc("client_submit_inventory", { p_token_hash: tokenHash });
  if (submitError) {
    const mapped = errorOf(submitError.message);
    if (mapped.status === 500) console.error("[client-order] submit failed:", submitError.code);
    return json({ code: mapped.code }, mapped.status);
  }
  return json({ ok: true, version }, 200);
});
