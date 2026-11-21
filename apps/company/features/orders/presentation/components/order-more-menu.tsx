"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { cancelOrderAction } from "../../application/actions/cancel-order";
import type { CancelOrderState } from "../../application/schemas/cancel-order";
import type { OrderDetailText } from "../orders-text";

type Props = {
  lang: Locale;
  orderId: string;
  /** Lo calcula `cancelRule` con la misma regla que la base de datos. */
  rule: "allowed" | "job-started";
  /** Hay un trabajo programado que también se cancela. */
  hasScheduledJob: boolean;
  label: string;
  t: OrderDetailText["cancel"];
};

const IDLE: CancelOrderState = { status: "idle" };

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const secondary = `inline-flex h-10 cursor-pointer items-center rounded-full border border-field-border bg-surface px-4 text-sm font-bold text-foreground ${focus}`;
const danger = `inline-flex h-10 cursor-pointer items-center rounded-full bg-danger-foreground px-4.5 text-sm font-bold text-background disabled:cursor-wait disabled:opacity-70 ${focus}`;

/**
 * Menú "Mais ações" del detalle del pedido. Por ahora solo tiene "Cancelar pedido" (RF-69), al final y en rojo, como
 * en la propuesta del menú; las demás opciones llegan cuando se decidan. Cancelar pide el motivo en el mismo panel.
 */
export function OrderMoreMenu({ lang, orderId, rule, hasScheduledJob, label, t }: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(cancelOrderAction, IDLE);
  const wrapper = useRef<HTMLDivElement>(null);

  // Al cancelar bien no hace falta cerrar nada: la página se refresca con el pedido cancelado y la cabecera ya no
  // muestra este menú.
  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  // Escape y clic fuera cierran el panel, salvo mientras se envía
  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setConfirming(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) close();
    };
    const onClick = (event: MouseEvent) => {
      if (!pending && wrapper.current && !wrapper.current.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, pending]);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls="order-more-menu"
        onClick={() => (open ? close() : setOpen(true))}
        className={`grid size-12 cursor-pointer place-items-center rounded-full border border-field-border bg-surface text-foreground ${focus}`}
      >
        <Icon name="moreHorizontal" size={20} />
      </button>

      {open ? (
        <div
          id="order-more-menu"
          className="absolute top-14 right-0 z-20 flex w-[min(380px,calc(100vw-32px))] flex-col gap-3 rounded-[18px] border border-line bg-surface p-3 shadow-lg"
        >
          {confirming ? (
            <form action={action} className="flex flex-col gap-3 p-1">
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="orderId" value={orderId} />
              <p className="text-base font-bold">{interpolate(t.title, { id: orderId })}</p>
              <label className="flex flex-col gap-1 text-[13px] font-bold">
                {t.reason}
                <textarea
                  name="reason"
                  rows={2}
                  maxLength={500}
                  required
                  autoFocus
                  placeholder={t.reasonPlaceholder}
                  className={`rounded-xl border border-field-border bg-surface px-3 py-2 text-[15px] font-normal text-foreground ${focus}`}
                />
              </label>
              <p className="text-xs leading-snug text-muted">
                {t.note}
                {hasScheduledJob ? ` ${t.noteJob}` : null}
              </p>
              {state.status === "error" ? (
                <p role="alert" className="text-[13px] font-bold text-danger-foreground">
                  {t.errors[state.error]}
                </p>
              ) : null}
              <span className="flex flex-wrap justify-end gap-2">
                <button type="button" className={secondary} onClick={() => setConfirming(false)} disabled={pending}>
                  {t.back}
                </button>
                <button type="submit" disabled={pending} className={danger}>
                  {t.confirm}
                </button>
              </span>
            </form>
          ) : rule === "job-started" ? (
            <p role="status" className="flex flex-col gap-1 p-1 text-sm">
              <span className="font-bold text-muted">{t.action}</span>
              <span className="text-muted">{t.jobStarted}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-danger-foreground hover:bg-danger-surface ${focus}`}
            >
              <Icon name="close" size={16} strokeWidth={3} />
              {t.action}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
