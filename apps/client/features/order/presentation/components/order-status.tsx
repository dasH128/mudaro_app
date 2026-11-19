import { Icon, MudaroSymbol, type IconName } from "@mudaro/ui";
import { formatDate } from "@mudaro/validation";

import { interpolate } from "@/app/i18n/interpolate";
import { firstName, type ClientOrder } from "@/features/order/domain/types";
import type { ClientText } from "../inventory-text";

/** Marca de Mudaro arriba de cada pantalla del cliente. */
export function ClientBrand() {
  return (
    <div className="flex items-center gap-2.5 text-lg font-extrabold">
      <span aria-hidden="true">
        <MudaroSymbol className="size-7" />
      </span>
      Mudaro
    </div>
  );
}

/**
 * Saludo, empresa y validez del enlace. Con el inventario ya enviado solo se saluda: preguntar "o que vai levar?" o
 * decir hasta cuándo se puede editar confundiría.
 */
export function OrderHeader({ t, order, state }: { t: ClientText; order: ClientOrder; state: "draft" | "submitted" | "expired" }) {
  const h = t.header;
  const values = { company: order.companyName, name: firstName(order.contactName) };
  return (
    <header className="flex flex-col gap-2">
      <span className="text-xs font-bold tracking-[0.16em] text-muted uppercase">{interpolate(h.eyebrow, values)}</span>
      <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
        {interpolate(state === "draft" ? h.title : h.greeting, values)}
      </h1>
      {state === "draft" ? <p className="max-w-160 text-base text-muted">{interpolate(h.subtitle, values)}</p> : null}
      {order.expiresAt && state !== "submitted" ? (
        <p className={`text-sm font-bold ${state === "expired" ? "text-danger-foreground" : "text-foreground"}`}>
          {interpolate(state === "expired" ? h.expired : h.validUntil, { date: formatDate(order.expiresAt) })}
        </p>
      ) : null}
    </header>
  );
}

/** Mensaje de pantalla completa: enlace no válido, caducado o inventario ya enviado. */
export function StatusCard({
  icon,
  tone,
  title,
  text,
  children,
}: {
  icon: IconName;
  tone: "success" | "warn" | "danger";
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  const badge = {
    success: "border-success-border bg-success-surface text-success-foreground",
    warn: "border-line bg-warn-surface text-foreground",
    danger: "border-danger-border bg-danger-surface text-danger-foreground",
  }[tone];
  return (
    <section className="flex max-w-140 flex-col items-start gap-4 rounded-3xl border border-line bg-surface p-7">
      <span className={`grid size-13 place-items-center rounded-full border ${badge}`}>
        <Icon name={icon} size={26} strokeWidth={2.4} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-2xl font-extrabold">{title}</h2>
        <p className="text-[15px] text-muted">{text}</p>
      </div>
      {children}
    </section>
  );
}
