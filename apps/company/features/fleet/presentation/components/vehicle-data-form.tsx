"use client";

import { useActionState, useState } from "react";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { formatAmount, formatCompact, formatInteger } from "@/app/lib/format";
import { updateVehicleDataAction } from "../../application/actions/edit-vehicle";
import type { DataField, VehicleDataState } from "../../application/schemas/vehicle-data";
import { VEHICLE_TYPES, type VehicleType } from "../../domain/new-vehicle";
import type { Vehicle } from "../../domain/types";
import type { FleetText } from "../fleet-text";

type Props = {
  lang: Locale;
  vehicle: Pick<Vehicle, "id" | "type" | "capacityM3" | "maxLoadKg" | "costPerKmCents" | "costMissing">;
  /** Solo los textos que usa el formulario: el resto del diccionario no viaja al cliente. */
  t: {
    data: FleetText["panel"]["data"];
    errors: FleetText["new"]["errors"];
    types: Record<VehicleType, string>;
  };
};

type Values = { type: VehicleType; capacity: string; maxLoad: string; cost: string };

const IDLE: VehicleDataState = { status: "idle" };

const label = "flex flex-col gap-1 text-[13px] font-bold";
const input = "min-w-0 flex-1 bg-transparent px-3 text-[15px] font-bold text-foreground outline-none";
const box = "flex h-10.5 items-center overflow-hidden rounded-xl font-normal focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary";
const heading = "text-base font-bold";

function initialValues(vehicle: Props["vehicle"]): Values {
  return {
    type: vehicle.type,
    capacity: formatCompact(vehicle.capacityM3),
    maxLoad: vehicle.maxLoadKg === null ? "" : formatInteger(vehicle.maxLoadKg),
    cost: vehicle.costPerKmCents === null ? "" : formatAmount(vehicle.costPerKmCents),
  };
}

/** "Dados do veículo" (P7): cada campo se guarda al salir de él, y el tipo al elegirlo (RF-05). */
export function VehicleDataForm({ lang, vehicle, t }: Props) {
  const [state, formAction, pending] = useActionState(updateVehicleDataAction, IDLE);
  const [values, setValues] = useState<Values>(() => initialValues(vehicle));
  // Últimos valores enviados: salir de un campo sin cambiarlo no vuelve a guardar
  const [sent, setSent] = useState<Values>(values);

  const errors = state.status === "error" ? state.fieldErrors : {};
  const formError = state.status === "error" ? state.formError : undefined;

  const set = (key: keyof Values, value: string) => setValues((current) => ({ ...current, [key]: value }));

  function save(next: Values, form: HTMLFormElement | null) {
    const same = (Object.keys(next) as (keyof Values)[]).every((key) => next[key] === sent[key]);
    if ((same && state.status !== "error") || !form) return;
    setSent(next);
    form.requestSubmit();
  }

  const errorId = (field: DataField) => `vehicle-${field}-error`;
  const fieldProps = (field: Exclude<DataField, "type">) => ({
    id: `vehicle-${field}`,
    name: field,
    value: values[field],
    inputMode: "decimal" as const,
    autoComplete: "off",
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set(field, event.target.value),
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => save(values, event.currentTarget.form),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? errorId(field) : undefined,
    className: input,
  });
  const boxClass = (field: DataField, warn = false) =>
    `${box} ${errors[field] ? "border-2 border-danger-border" : warn ? "border-2 border-warn-border bg-warn-surface" : "border border-field-border"}`;

  const status = pending ? t.data.saving : state.status === "saved" ? t.data.saved : t.data.saveOnBlur;

  return (
    <form action={formAction} noValidate aria-labelledby="vehicle-data" className="flex flex-col gap-3">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="vehicleId" value={vehicle.id} />

      <div className="flex items-baseline justify-between gap-2">
        <h3 id="vehicle-data" className={heading}>
          {t.data.title}
        </h3>
        <span role="status" className="flex items-center gap-1 text-xs text-muted">
          {state.status === "saved" && !pending ? <Icon name="check" size={12} strokeWidth={2.6} /> : null}
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <label className={label} htmlFor="vehicle-capacity">
          {t.data.capacity}
          <span className={boxClass("capacity")}>
            <input {...fieldProps("capacity")} />
            <span className="px-2.5 text-[13px] text-muted">m³</span>
          </span>
          {errors.capacity ? (
            <span id={errorId("capacity")} className="text-xs font-normal text-danger-foreground">
              {t.errors[errors.capacity]}
            </span>
          ) : null}
        </label>
        <label className={label} htmlFor="vehicle-maxLoad">
          {t.data.maxLoad}
          <span className={boxClass("maxLoad")}>
            <input {...fieldProps("maxLoad")} inputMode="numeric" />
            <span className="px-2.5 text-[13px] text-muted">kg</span>
          </span>
          {errors.maxLoad ? (
            <span id={errorId("maxLoad")} className="text-xs font-normal text-danger-foreground">
              {t.errors[errors.maxLoad]}
            </span>
          ) : null}
        </label>
        <label className={label} htmlFor="vehicle-cost">
          {t.data.costPerKm}
          <span className={boxClass("cost", vehicle.costMissing && values.cost === "")}>
            <input {...fieldProps("cost")} />
            <span className="px-2.5 text-[13px] text-muted">€</span>
          </span>
          {errors.cost ? (
            <span id={errorId("cost")} className="text-xs font-normal text-danger-foreground">
              {t.errors[errors.cost]}
            </span>
          ) : null}
        </label>
        <label className={label} htmlFor="vehicle-type">
          {t.data.type}
          <select
            id="vehicle-type"
            name="type"
            value={values.type}
            onChange={(event) => {
              const next = { ...values, type: event.target.value as VehicleType };
              setValues(next);
              save(next, event.currentTarget.form);
            }}
            aria-invalid={errors.type ? true : undefined}
            className="h-10.5 rounded-xl border border-field-border bg-surface px-3 text-[15px] font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t.types[type]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {vehicle.costMissing && values.cost === "" ? (
        <span className="text-[13px] font-bold text-warn-foreground">{t.data.costMissing}</span>
      ) : null}
      {formError ? (
        <p role="alert" className="text-[13px] font-bold text-danger-foreground">
          {t.data.formErrors[formError]}
        </p>
      ) : null}
      <p className="flex gap-2 text-xs leading-snug text-muted">
        <Icon name="lock" size={14} strokeWidth={2.2} className="mt-px flex-none" />
        {t.data.privacy}
      </p>
    </form>
  );
}
