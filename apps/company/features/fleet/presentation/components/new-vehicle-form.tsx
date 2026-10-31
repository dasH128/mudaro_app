"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";
import { createVehicleAction } from "../../application/actions/create-vehicle";
import { IDLE } from "../../application/actions/state";
import type { FormValues } from "../../application/schemas/new-vehicle";
import { parseDecimal, type FleetSnapshot, type VehicleType } from "../../domain/new-vehicle";
import { normalizePlate } from "../../domain/plate";
import type { FleetText } from "../fleet-text";
import { clearDraft, loadDraft, saveDraft } from "../new-vehicle-draft";
import { defaultValues, suggestedValues, type NewVehicleText } from "../new-vehicle-text";
import { NewVehicleAside, SectionNav } from "./new-vehicle-aside";
import { AvailabilitySection, CapacitySection, IdentificationSection, UpcomingSection } from "./vehicle-details-sections";
import { VehicleTypeSection } from "./vehicle-type-section";

type Props = {
  lang: Locale;
  /** Solo los textos del formulario y las etiquetas de estado: el resto del diccionario no viaja al cliente. */
  t: NewVehicleText;
  statusLabels: FleetText["status"];
  /** "Frota", para el primer nivel del camino de migas. */
  fleetTitle: string;
  fleet: FleetSnapshot;
  /** Matrícula del vehículo recién añadido con "Adicionar e criar outro", para avisar. */
  addedPlate?: string;
};

const link =
  "font-bold text-foreground underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const FORM_ID = "new-vehicle-form";

const secondary =
  "inline-flex h-12 cursor-pointer items-center rounded-full border border-field-border bg-surface px-5 text-[15px] font-bold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70";
const primary =
  "inline-flex h-12 cursor-pointer items-center rounded-full bg-primary px-6 text-[15px] font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-wait disabled:opacity-70";

export function NewVehicleForm({ lang, t: n, statusLabels, fleetTitle, fleet, addedPlate }: Props) {
  const [state, formAction, pending] = useActionState(createVehicleAction, IDLE);
  const [values, setValues] = useState<FormValues>(() => defaultValues(fleet, n));
  const summaryRef = useRef<HTMLDivElement>(null);
  // "idle" hasta saber si el navegador deja guardar el borrador
  const [draft, setDraft] = useState<"idle" | "saved" | "off">("idle");

  const errors = state.status === "error" ? state.fieldErrors : {};
  const errorCount = Object.keys(errors).length;

  // Lleva el foco al resumen cuando el servidor rechaza el formulario
  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
  }, [state]);

  // Al abrir, recupera el borrador que quedó de la última vez
  useEffect(() => {
    const saved = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe en el navegador: no se puede leer al renderizar sin romper la hidratación
    if (saved) setValues(saved);
  }, []);

  // Guarda el borrador con cada cambio (y de nuevo si el servidor rechaza el envío, que lo borra al enviar)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refleja en pantalla si el navegador aceptó guardar
    setDraft(saveDraft(values) ? "saved" : "off");
  }, [values, state]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  // Al cambiar de tipo se proponen sus valores habituales (nombre, capacidad, carga y coste)
  function pickType(type: VehicleType) {
    setValues((current) => ({ ...current, type, ...suggestedValues(type, fleet, n) }));
  }

  const plate = normalizePlate(values.plate);
  const plateOk = plate !== null && !fleet.vehicles.some((v) => v.plate === plate);
  const capacityOk = parseDecimal(values.capacity) > 0;
  const costOk = parseDecimal(values.cost) > 0;

  return (
    <>
      <header className="flex flex-col gap-2.5">
        <nav aria-label={n.breadcrumb.label} className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link href={localePath(lang, ROUTES.fleet.list)} className={link}>
            {fleetTitle}
          </Link>
          <Icon name="chevronRight" size={14} />
          <span aria-current="page">{n.title}</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{n.title}</h1>
            <p className="text-base text-muted">{n.subtitle}</p>
          </div>
          {draft === "saved" ? (
            <span className="inline-flex h-8.5 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[13px] text-muted">
              <Icon name="check" size={14} strokeWidth={2.6} className="text-success-foreground" />
              {n.draftSaved}
            </span>
          ) : null}
        </div>
        {addedPlate ? (
          <p role="status" className="flex w-fit items-center gap-2 rounded-xl border border-success-border bg-success-surface px-3.5 py-2.5 text-sm font-bold text-success-foreground">
            <Icon name="check" size={16} strokeWidth={2.6} />
            {interpolate(n.added, { plate: addedPlate })}
          </p>
        ) : null}
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <SectionNav
          t={n}
          progress={{ type: true, identification: plateOk, capacity: capacityOk && costOk, availability: true }}
        />

        <form
          id={FORM_ID}
          action={formAction}
          // El envío sustituye al borrador: si el servidor rechaza el formulario, el efecto de arriba lo vuelve a guardar
          onSubmit={clearDraft}
          noValidate
          className="flex min-w-0 flex-[999_1_480px] flex-col gap-5"
        >
          <input type="hidden" name="lang" value={lang} />

          {errorCount > 0 ? (
            <div
              ref={summaryRef}
              tabIndex={-1}
              role="alert"
              className="flex items-center gap-2.5 rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm font-bold text-danger-foreground outline-none"
            >
              <Icon name="alert" size={18} />
              {n.errorSummary}
            </div>
          ) : null}

          <VehicleTypeSection t={n} value={values.type} onChange={pickType} />
          <IdentificationSection t={n} values={values} errors={errors} set={set} fleet={fleet} />
          <CapacitySection t={n} values={values} errors={errors} set={set} fleet={fleet} />
          <AvailabilitySection t={n} values={values} set={set} />
          <UpcomingSection t={n} />
        </form>

        <NewVehicleAside
          t={n}
          statusLabels={statusLabels}
          values={values}
          fleetCapacityM3={fleet.activeCapacityM3}
          checks={{ plate: plateOk, capacity: capacityOk, cost: costOk }}
        />
      </div>

      {/* Barra fija de acciones: compensa el padding del <main>. Los botones envían el formulario de arriba. */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-7 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-4 sm:-mx-8 sm:px-8 lg:-mx-10 lg:-mb-10 lg:px-10">
        <Link
          href={localePath(lang, ROUTES.fleet.list)}
          onClick={clearDraft}
          className={`text-sm ${link}`}
        >
          {n.actions.cancel}
        </Link>
        <div className="flex flex-wrap gap-2.5">
          <button type="submit" form={FORM_ID} name="intent" value="another" disabled={pending} className={secondary}>
            {n.actions.another}
          </button>
          <button type="submit" form={FORM_ID} name="intent" value="add" disabled={pending} className={primary}>
            {pending ? n.actions.adding : n.actions.add}
          </button>
        </div>
      </div>
    </>
  );
}
