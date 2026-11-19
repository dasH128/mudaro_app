"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  EMPTY_ACCESS,
  INVENTORY_STEPS,
  countInRoom,
  isAccessComplete,
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
  type InventoryStep,
  type RoutePoint,
} from "@mudaro/inventory";
import { formatVolume } from "@mudaro/validation";

import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { saveClientInventoryAction, submitClientInventoryAction } from "@/features/order/application/actions/inventory";
import type { ClientError } from "@/features/order/domain/types";
import type { InventoryText } from "../inventory-text";
import { AccessForm } from "./access-form";
import { CatalogGrid } from "./catalog-grid";
import { ExtrasStep } from "./extras-step";
import { InventoryFooter, type SaveStatus } from "./inventory-footer";
import { STEP_PANEL_ID, InventorySteps, stepTabId } from "./inventory-steps";
import { InventorySummary } from "./inventory-summary";
import { RoomsNav } from "./rooms-nav";

type Props = {
  lang: Locale;
  t: InventoryText;
  /** Token del enlace: es la única autorización del cliente. Nunca se muestra ni se guarda en el navegador. */
  token: string;
  rooms: readonly CatalogRoom[];
  catalog: readonly CatalogItem[];
  extras: readonly ExtraType[];
  points: readonly RoutePoint[];
  initial: InventoryDraft;
};

// Adaptación del editor de apps/company para el cliente (RF-19 a RF-26). Mismo flujo en tres pasos: objetos, accesos
// y extras. El borrador se guarda en servidor al cambiar de paso; "Enviar inventário" lo envía a la empresa.
// Pendiente: diseño propio de la web del cliente (sin prototipos en docs/design/customer).
export function ClientInventoryEditor({ lang, t, token, rooms, catalog, extras, points, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<InventoryStep>("items");
  const [room, setRoom] = useState<string>(rooms[0]?.slug ?? "");
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({ ...initial.quantities });
  const [access, setAccess] = useState<Record<string, AccessPoint>>({ ...initial.access });
  const [chosen, setChosen] = useState<ChosenExtras>(initial.extras);
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  const payload = () => ({
    token,
    lines: Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([key, quantity]) => ({ ...splitLineKey(key), quantity })),
    access: points.map((point) => ({ addressId: point.addressId, ...(access[point.id] ?? EMPTY_ACCESS) })),
    extras: Object.entries(chosen).map(([id, note]) => ({ id, note })),
  });

  // Lo último que se guardó: si nada cambió, cambiar de paso no vuelve a guardar.
  const lastSaved = useRef(JSON.stringify(payload()));

  const fail = (error: ClientError) => {
    setStatus({ kind: "error", error });
    if (error === "accessIncomplete") setStep("access");
    if (error === "empty") setStep("items");
    // El enlace caducó o se sustituyó mientras editaba: la página muestra el estado real.
    if (error === "expired" || error === "notFound" || error === "noDraft") router.refresh();
  };

  const save = async (): Promise<boolean> => {
    const next = payload();
    const serialized = JSON.stringify(next);
    if (serialized === lastSaved.current) return true;
    setStatus({ kind: "saving" });
    const result = await saveClientInventoryAction(next);
    if (!result.ok) {
      fail(result.error);
      return false;
    }
    lastSaved.current = serialized;
    setStatus({ kind: "saved" });
    return true;
  };

  const goTo = (next: InventoryStep) => {
    setStep(next);
    startTransition(async () => {
      await save();
    });
  };

  const finish = () =>
    startTransition(async () => {
      setStatus({ kind: "saving" });
      const result = await submitClientInventoryAction(payload());
      if (!result.ok) {
        fail(result.error);
        return;
      }
      // La página pasa a mostrar "Inventário enviado".
      router.refresh();
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

  // Lo mismo que exige el envío: al menos un objeto y los accesos obligatorios de cada punto (RF-23).
  const missing: Record<InventoryStep, string | null> = {
    items: totals.items > 0 ? null : t.steps.items.missing,
    access: points.every((point) => isAccessComplete(access[point.id] ?? EMPTY_ACCESS)) ? null : t.steps.access.missing,
    extras: null,
  };

  const move = (delta: number) => {
    const next = INVENTORY_STEPS[INVENTORY_STEPS.indexOf(step) + delta];
    if (next) goTo(next);
  };

  return (
    <>
      <InventorySteps t={t} current={step} hints={hints} missing={missing} onPick={goTo} />

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
