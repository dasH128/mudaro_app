"use client";

import { useActionState, useState } from "react";

import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { setVehicleActiveAction } from "../../application/actions/edit-vehicle";
import type { VehicleActiveState } from "../../application/schemas/vehicle-data";
import { INACTIVE_REASONS, type InactiveReason } from "../../domain/types";
import type { FleetText } from "../fleet-text";
import { focusRing } from "./fleet-parts";

type Props = {
  lang: Locale;
  vehicleId: string;
  name: string;
  active: boolean;
  t: {
    panel: Pick<FleetText["panel"], "on" | "off" | "activate" | "deactivate" | "deactivation">;
    formErrors: FleetText["panel"]["data"]["formErrors"];
  };
};

const IDLE: VehicleActiveState = { status: "idle" };

const secondary = `inline-flex h-9 cursor-pointer items-center rounded-full border border-field-border bg-surface px-4 text-[13px] font-bold text-foreground ${focusRing}`;
const primary = `inline-flex h-9 cursor-pointer items-center rounded-full bg-foreground px-4 text-[13px] font-bold text-background disabled:cursor-wait disabled:opacity-70 ${focusRing}`;

/**
 * Interruptor Ativo/Inativo del panel del vehículo (RF-05). Activar se guarda al pulsar; desactivar pide antes el motivo
 * (taller u otro), porque un vehículo inactivo deja de salir en los orçamentos y en la agenda.
 */
export function VehicleActiveSwitch({ lang, vehicleId, name, active, t }: Props) {
  const [state, formAction, pending] = useActionState(setVehicleActiveAction, IDLE);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState<InactiveReason>("workshop");
  const p = t.panel;

  return (
    <div className="flex w-full flex-col gap-3">
      <form action={formAction} className="flex justify-end" onSubmit={(event) => {
        // Desactivar no se envía todavía: primero se pide el motivo
        if (active) {
          event.preventDefault();
          setAsking(true);
        }
      }}>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <input type="hidden" name="active" value="true" />
        <button
          type="submit"
          role="switch"
          aria-checked={active}
          aria-label={interpolate(active ? p.deactivate : p.activate, { name })}
          aria-expanded={active ? asking : undefined}
          disabled={pending}
          className={`inline-flex h-9 cursor-pointer items-center gap-2.5 pr-0.5 pl-2 text-[13px] font-bold text-foreground disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
        >
          {active ? p.on : p.off}
          <span className={`relative h-7 w-11.5 flex-none rounded-full ${active ? "bg-foreground" : "bg-status-off-border"}`}>
            <span className={`absolute top-1 size-5 rounded-full ${active ? "left-5.5 bg-background" : "left-1 bg-surface"}`} />
          </span>
        </button>
      </form>

      {active && asking ? (
        <form action={formAction} className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface p-3.5">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <input type="hidden" name="active" value="false" />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold">{p.deactivation.title}</legend>
            {INACTIVE_REASONS.map((value) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  className="size-4 accent-foreground"
                />
                {p.deactivation.reasons[value]}
              </label>
            ))}
          </fieldset>
          <p className="text-xs leading-snug text-muted">{p.deactivation.note}</p>
          <span className="flex justify-end gap-2">
            <button type="button" className={secondary} onClick={() => setAsking(false)}>
              {p.deactivation.cancel}
            </button>
            <button type="submit" className={primary} disabled={pending}>
              {p.deactivation.confirm}
            </button>
          </span>
        </form>
      ) : null}

      {state.status === "error" ? (
        <p role="alert" className="text-[13px] font-bold text-danger-foreground">
          {t.formErrors[state.formError]}
        </p>
      ) : null}
    </div>
  );
}
