"use client";

import { useState } from "react";

import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatVolume } from "@/app/lib/format";
import {
  EMPTY_ACCESS,
  INVENTORY_STEPS,
  ROOM_KEYS,
  countInRoom,
  normalizeSearch,
  summarize,
  type AccessPoint,
  type CatalogItem,
  type ExtraService,
  type InventoryStep,
  type RoomKey,
} from "../../domain/types";
import type { InventoryText } from "../inventory-text";
import { AccessForm } from "./access-form";
import { CatalogGrid } from "./catalog-grid";
import { ExtrasStep } from "./extras-step";
import { InventoryFooter } from "./inventory-footer";
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
  order: InventoryOrder;
  catalog: readonly CatalogItem[];
  extras: readonly ExtraService[];
  /** Destino de "Guardar e sair" y "Concluir inventário". */
  exitHref: string;
};

// TODO(supabase): hoy el borrador vive solo en el navegador. Con datos reales se guarda en servidor
// (Server Action con zod: acceso, cantidades y extras) y "Concluir" pasa el pedido a "Inventário recebido".
export function InventoryEditor({ lang, t, order, catalog, extras, exitHref }: Props) {
  const [step, setStep] = useState<InventoryStep>("items");
  const [room, setRoom] = useState<RoomKey>(ROOM_KEYS[0]);
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [access, setAccess] = useState<Record<"origin" | "destination", AccessPoint>>({
    origin: EMPTY_ACCESS,
    destination: EMPTY_ACCESS,
  });
  const [chosen, setChosen] = useState<Record<string, boolean>>({});

  const totals = summarize(catalog, quantities);
  const counts = Object.fromEntries(ROOM_KEYS.map((key) => [key, countInRoom(catalog, quantities, key)])) as Record<RoomKey, number>;
  const roomsUsed = ROOM_KEYS.filter((key) => counts[key] > 0).length;
  const chosenCount = extras.filter((extra) => chosen[extra.id]).length;

  const roomCatalog = catalog.filter((item) => item.room === room);
  const search = normalizeSearch(query);
  const visible = search ? roomCatalog.filter((item) => normalizeSearch(item.name).includes(search)) : roomCatalog;
  const roomItems = roomCatalog.filter((item) => (quantities[item.id] ?? 0) > 0);

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
    if (next) setStep(next);
  };

  return (
    <>
      <InventoryHeader t={t} order={order} exitHref={exitHref} />
      <InventorySteps t={t} current={step} hints={hints} onPick={setStep} />

      <div id={STEP_PANEL_ID} role="tabpanel" aria-labelledby={stepTabId(step)}>
        {step === "items" ? (
          <div className="flex flex-wrap items-start gap-5">
            <RoomsNav
              t={t}
              current={room}
              counts={counts}
              onPick={(next) => {
                setRoom(next);
                setQuery("");
              }}
            />
            <CatalogGrid
              t={t}
              title={t.rooms.names[room]}
              items={visible}
              quantities={quantities}
              query={query}
              onQuery={setQuery}
              onChange={(id, quantity) => setQuantities((current) => ({ ...current, [id]: Math.max(0, quantity) }))}
            />
            <InventorySummary t={t} totals={totals} roomItems={roomItems} quantities={quantities} />
          </div>
        ) : null}

        {step === "access" ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {(["origin", "destination"] as const).map((point) => (
              <AccessForm
                key={point}
                t={t}
                id={point}
                place={order[point]}
                value={access[point]}
                onChange={(value) => setAccess((current) => ({ ...current, [point]: value }))}
              />
            ))}
          </div>
        ) : null}

        {step === "extras" ? (
          <ExtrasStep
            lang={lang}
            t={t}
            extras={extras}
            chosen={chosen}
            onToggle={(id) => setChosen((current) => ({ ...current, [id]: !current[id] }))}
          />
        ) : null}
      </div>

      <InventoryFooter
        t={t}
        step={step}
        totals={`${pluralize(lang, totals.items, t.itemsCount)} · ${formatVolume(totals.volumeM3)}`}
        finishHref={exitHref}
        onBack={() => move(-1)}
        onNext={() => move(1)}
      />
    </>
  );
}
