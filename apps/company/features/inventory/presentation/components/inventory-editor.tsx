"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatVolume } from "@/app/lib/format";
import { saveInventoryAction, submitInventoryAction } from "@/features/inventory/application/actions/inventory";
import {
  EMPTY_ACCESS,
  INVENTORY_STEPS,
  countInRoom,
  lineKey,
  normalizeSearch,
  splitLineKey,
  summarize,
  type AccessPoint,
  type CatalogItem,
  type CatalogRoom,
  type ChosenExtras,
  type ExtraType,
  type InventoryDraft,
  type InventoryError,
  type InventoryStep,
  type RoutePoint,
} from "../../domain/types";
import type { InventoryText } from "../inventory-text";
import { AccessForm } from "./access-form";
import { CatalogGrid } from "./catalog-grid";
import { ExtrasStep } from "./extras-step";
import { InventoryFooter, type SaveStatus } from "./inventory-footer";
import { InventoryHeader } from "./inventory-header";
import { STEP_PANEL_ID, InventorySteps, stepTabId } from "./inventory-steps";
import { InventorySummary } from "./inventory-summary";
import { RoomsNav } from "./rooms-nav";

/** Lo que el editor muestra del pedido. */
export type InventoryOrder = {
  clientName: string;
  origin: string;
  destination: string;
  /** aaaa-mm-dd */
  date: string;
  /** El inventario también se pidió al cliente por enlace: al rellenarlo la empresa, él deja de poder editar. */
  linkLocked: boolean;
};

type Props = {
  lang: Locale;
  t: InventoryText;
  /** Número visible del pedido (MD-0836). */
  orderId: string;
  order: InventoryOrder;
  /** Versión del borrador que se edita. */
  version: number;
  rooms: readonly CatalogRoom[];
  catalog: readonly CatalogItem[];
  extras: readonly ExtraType[];
  /** Origen, paradas y destino, en orden. */
  points: readonly RoutePoint[];
  /** Lo que ya estaba guardado en el borrador. */
  initial: InventoryDraft;
  /** Destino de "Guardar e sair". */
  exitHref: string;
};

// El borrador se guarda en servidor al cambiar de paso y con "Guardar e sair" (save_inventory_draft). "Concluir"
// guarda todo y envía la versión: el pedido pasa a "Inventário recebido" (RF-26).
export function InventoryEditor({ lang, t, orderId, order, version, rooms, catalog, extras, points, initial, exitHref }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<InventoryStep>("items");
  const [room, setRoom] = useState<string>(rooms[0]?.slug ?? "");
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({ ...initial.quantities });
  // Accesos por punto del recorrido (clave: RoutePoint.id). Lo que falta se trata como vacío.
  const [access, setAccess] = useState<Record<string, AccessPoint>>({ ...initial.access });
  const [chosen, setChosen] = useState<ChosenExtras>(initial.extras);
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  const payload = () => ({
    lang,
    orderId,
    lines: Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([key, quantity]) => ({ ...splitLineKey(key), quantity })),
    access: points.map((point) => ({ addressId: point.addressId, ...(access[point.id] ?? EMPTY_ACCESS) })),
    extras: Object.entries(chosen).map(([id, note]) => ({ id, note })),
  });

  // Lo último que se guardó: si nada cambió, cambiar de paso no vuelve a guardar.
  const lastSaved = useRef(JSON.stringify(payload()));

  const save = async (): Promise<boolean> => {
    const next = payload();
    const serialized = JSON.stringify(next);
    if (serialized === lastSaved.current) return true;
    setStatus({ kind: "saving" });
    const result = await saveInventoryAction(next);
    if (!result.ok) {
      setStatus({ kind: "error", error: result.error });
      return false;
    }
    lastSaved.current = serialized;
    setStatus({ kind: "saved" });
    return true;
  };

  const fail = (error: InventoryError) => {
    setStatus({ kind: "error", error });
    if (error === "accessIncomplete") setStep("access");
    if (error === "empty") setStep("items");
  };

  const goTo = (next: InventoryStep) => {
    setStep(next);
    startTransition(async () => {
      await save();
    });
  };

  const saveAndExit = () =>
    startTransition(async () => {
      if (await save()) router.push(exitHref);
    });

  const finish = () =>
    startTransition(async () => {
      setStatus({ kind: "saving" });
      // Si todo va bien, la acción redirige al detalle del pedido y no devuelve nada.
      const result = await submitInventoryAction(payload());
      if (result && !result.ok) fail(result.error);
    });

  const totals = summarize(catalog, quantities);
  const counts = Object.fromEntries(rooms.map(({ slug }) => [slug, countInRoom(quantities, slug)]));
  const roomsUsed = rooms.filter(({ slug }) => (counts[slug] ?? 0) > 0).length;
  const chosenCount = extras.filter((extra) => extra.id in chosen).length;

  const roomCatalog = catalog.filter((item) => item.rooms.includes(room));
  const search = normalizeSearch(query);
  const visible = search ? roomCatalog.filter((item) => normalizeSearch(item.name).includes(search)) : roomCatalog;
  const quantityOf = (itemId: string) => quantities[lineKey(room, itemId)] ?? 0;
  const roomLines = roomCatalog
    .map((item) => ({ item, quantity: quantityOf(item.id) }))
    .filter((line) => line.quantity > 0);

  const hints: Record<InventoryStep, string> = {
    items: interpolate(t.steps.items.hint, {
      items: pluralize(lang, totals.items, t.itemsCount),
      rooms: pluralize(lang, roomsUsed, t.roomsCount),
    }),
    access: t.steps.access.hint,
    extras: pluralize(lang, chosenCount, t.steps.extras.hint),
  };

  const move = (delta: number) => {
    const next = INVENTORY_STEPS[INVENTORY_STEPS.indexOf(step) + delta];
    if (next) goTo(next);
  };

  return (
    <>
      <InventoryHeader t={t} order={order} version={version} pending={pending} onSaveAndExit={saveAndExit} />
      <InventorySteps t={t} current={step} hints={hints} onPick={goTo} />

      <div id={STEP_PANEL_ID} role="tabpanel" aria-labelledby={stepTabId(step)}>
        {step === "items" ? (
          <div className="flex flex-wrap items-start gap-5">
            <RoomsNav
              t={t}
              rooms={rooms}
              current={room}
              counts={counts}
              onPick={(next) => {
                setRoom(next);
                setQuery("");
              }}
            />
            <CatalogGrid
              t={t}
              title={rooms.find(({ slug }) => slug === room)?.name ?? ""}
              items={visible}
              quantityOf={quantityOf}
              query={query}
              onQuery={setQuery}
              onChange={(itemId, quantity) =>
                setQuantities((current) => ({ ...current, [lineKey(room, itemId)]: Math.min(999, Math.max(0, quantity)) }))
              }
            />
            <InventorySummary t={t} totals={totals} roomLines={roomLines} />
          </div>
        ) : null}

        {step === "access" ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {points.map((point) => (
              <AccessForm
                key={point.id}
                t={t}
                point={point}
                value={access[point.id] ?? EMPTY_ACCESS}
                onChange={(value) => setAccess((current) => ({ ...current, [point.id]: value }))}
              />
            ))}
          </div>
        ) : null}

        {step === "extras" ? (
          <ExtrasStep
            t={t}
            extras={extras}
            chosen={chosen}
            onToggle={(id) =>
              setChosen(({ [id]: removed, ...rest }) => (removed === undefined ? { ...rest, [id]: "" } : rest))
            }
            onNote={(id, note) => setChosen((current) => ({ ...current, [id]: note }))}
          />
        ) : null}
      </div>

      <InventoryFooter
        t={t}
        step={step}
        totals={`${pluralize(lang, totals.items, t.itemsCount)} · ${formatVolume(totals.volumeM3)}`}
        status={status}
        pending={pending}
        onBack={() => move(-1)}
        onNext={() => move(1)}
        onFinish={finish}
      />
    </>
  );
}
