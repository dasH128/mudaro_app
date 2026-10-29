"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { normalizePtPhone } from "@mudaro/validation";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { createOrderAction } from "@/features/orders/application/actions/create-order";
import { lookupClientAction } from "@/features/orders/application/actions/lookup-client";
import { IDLE } from "@/features/orders/application/actions/state";
import type { FormValues } from "@/features/orders/application/schemas/new-order";
import { firstName } from "@/features/orders/domain/client-name";
import { DEFAULT_LINK_VALIDITY_DAYS, type ClientSuggestion } from "@/features/orders/domain/types";
import { DEFAULT_VALUES } from "../default-values";
import type { OrdersText } from "../orders-text";
import { ClientSection } from "./client-section";
import type { SetValue } from "./form-types";
import { InventorySection } from "./inventory-section";
import { MoveSection } from "./move-section";
import { AfterSteps, MessagePreview } from "./order-side-panels";

type Props = {
  lang: Locale;
  t: OrdersText;
  /** Quién envía el mensaje y desde qué empresa (de la sesión cuando exista). */
  sender: string;
  company: string;
};

export function NewOrderForm({ lang, t, sender, company }: Props) {
  const n = t.new;
  const [state, formAction, pending] = useActionState(createOrderAction, IDLE);
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);
  const [suggestion, setSuggestion] = useState<ClientSuggestion | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const lastLookup = useRef("");
  const summaryRef = useRef<HTMLDivElement>(null);

  const errors = state.status === "error" ? state.fieldErrors : {};
  const errorCount = Object.keys(errors).length;

  // Lleva el foco al resumen cuando el servidor rechaza el formulario
  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
  }, [state]);

  const set: SetValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  // RF-14: al completarse el teléfono se busca el cliente. Si el número cambia, se suelta la ficha enlazada.
  function handlePhoneChange(value: string) {
    setValues((current) => ({ ...current, phone: value, clientId: "" }));
    setDismissed(false);

    const normalized = normalizePtPhone(value);
    if (!normalized) {
      lastLookup.current = "";
      setSuggestion(null);
      return;
    }
    if (normalized === lastLookup.current) return;

    lastLookup.current = normalized;
    lookupClientAction(value)
      .then((found) => {
        if (lastLookup.current === normalized) setSuggestion(found);
      })
      .catch(() => {
        if (lastLookup.current === normalized) setSuggestion(null);
      });
  }

  function applySuggestion() {
    if (!suggestion) return;
    setValues((current) => ({
      ...current,
      name: suggestion.name,
      email: suggestion.email ?? "",
      clientType: suggestion.type,
      clientId: suggestion.id,
    }));
  }

  const isLink = values.inventoryMode === "link";
  const days = Number(values.linkValidityDays) || DEFAULT_LINK_VALIDITY_DAYS;

  return (
    <div className="flex flex-wrap items-start gap-6">
      <form action={formAction} noValidate className="flex max-w-205 min-w-0 flex-[999_1_620px] flex-col gap-5">
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

        <ClientSection
          lang={lang}
          t={n}
          values={values}
          errors={errors}
          set={set}
          onPhoneChange={handlePhoneChange}
          suggestion={dismissed || values.clientId ? null : suggestion}
          onUseSuggestion={applySuggestion}
          onDismissSuggestion={() => setDismissed(true)}
        />
        <MoveSection t={n} values={values} errors={errors} set={set} />
        <InventorySection lang={lang} t={n} values={values} errors={errors} set={set} />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Link
            href={localePath(lang, ROUTES.home)}
            className="text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {n.actions.cancel}
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-primary px-5.5 text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-wait disabled:opacity-70"
          >
            {pending ? n.actions.creating : isLink ? n.actions.createLink : n.actions.createSelf}
            {pending ? null : <Icon name="arrowRight" size={18} strokeWidth={2.2} />}
          </button>
        </div>
      </form>

      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
        {isLink ? (
          <MessagePreview t={t} name={firstName(values.name)} sender={sender} company={company} days={days} />
        ) : null}
        <AfterSteps t={n} mode={values.inventoryMode} />
      </div>
    </div>
  );
}
