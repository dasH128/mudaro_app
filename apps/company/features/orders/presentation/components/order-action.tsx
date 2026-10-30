import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import type { OrderAction } from "@/features/orders/domain/list";
import { actionHref } from "../orders-href";
import type { OrdersListText } from "../orders-text";

type Props = {
  lang: Locale;
  t: OrdersListText;
  id: string;
  action: OrderAction;
  /** "card": botón grande con flecha (tarjetas de "Precisam de ti"). "row": botón compacto. */
  size: "card" | "row";
};

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** El siguiente paso de un pedido. Sin destino todavía, sale desactivado. */
export function OrderActionButton({ lang, t, id, action, size }: Props) {
  const label = t.actions[action];
  const href = actionHref(lang, action, id);
  // Solo "Criar proposta" y "Continuar" son el paso principal: van en oscuro
  const primary = action === "create-proposal" || action === "continue-proposal";
  const look = primary
    ? "border border-foreground bg-foreground text-background"
    : "border border-field-border bg-surface text-foreground";
  const dimensions = size === "card" ? "h-10 gap-2 px-4 text-sm" : "h-9 px-3.5 text-[13px]";
  const className = `inline-flex items-center whitespace-nowrap rounded-full font-bold ${dimensions} ${look} ${focus}`;

  const content = (
    <>
      {label}
      {size === "card" ? <Icon name="arrowRight" size={16} strokeWidth={2.2} /> : null}
    </>
  );

  if (!href) {
    return (
      <button type="button" disabled title={t.soon} className={`${className} cursor-not-allowed opacity-50`}>
        {content}
      </button>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/** Menú "Mais ações". Aún no tiene acciones: queda desactivado. */
export function OrderMoreButton({ t, id }: { t: OrdersListText; id: string }) {
  return (
    <button
      type="button"
      disabled
      title={t.soon}
      aria-label={interpolate(t.common.moreActions, { id })}
      className={`grid size-9 cursor-not-allowed place-items-center rounded-full text-foreground opacity-50 ${focus}`}
    >
      <Icon name="moreVertical" size={18} strokeWidth={3} />
    </button>
  );
}
