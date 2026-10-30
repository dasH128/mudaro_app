import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { pluralize } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { OrderDetail } from "../../domain/detail";
import type { OrdersText } from "../orders-text";
import { card, ghostButton, sectionTitle } from "./order-detail-parts";

/** Pestaña Propostas. El detalle de cada versión llega con el editor de propostas. */
export function OrderProposalsTab({ lang, t, order }: { lang: Locale; t: OrdersText; order: OrderDetail }) {
  const d = t.detail.proposals;
  const hasProposals = order.proposalCount > 0;

  return (
    <div role="status" className={`${card} items-center gap-3 px-6 py-10 text-center`}>
      <svg aria-hidden="true" width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="36" className="fill-primary" />
        <circle cx="44" cy="44" r="16" className="fill-on-ink" />
        <circle cx="44" cy="44" r="9" className="fill-sidebar" />
        <path d="M70 60 L86 68 L82 74 L66 66 Z" className="fill-primary" />
      </svg>
      <h2 className={sectionTitle}>{hasProposals ? pluralize(lang, order.proposalCount, d.count) : d.emptyTitle}</h2>
      {hasProposals ? (
        <Link href={localePath(lang, ROUTES.proposals.list)} className={`${ghostButton} h-10 px-4 text-sm`}>
          {d.view}
        </Link>
      ) : (
        <p className="max-w-105 text-[15px] text-muted">{order.inventory ? d.emptyReady : d.emptyWaiting}</p>
      )}
    </div>
  );
}
