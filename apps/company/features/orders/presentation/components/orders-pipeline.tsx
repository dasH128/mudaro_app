import Link from "next/link";

import { Icon, type IconName } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { ORDER_STAGES, type OrderStage } from "@/features/orders/domain/types";
import type { OrdersFilter, OrdersView } from "../../domain/list";
import { ordersHref } from "../orders-href";
import type { OrdersListText } from "../orders-text";

type Props = {
  lang: Locale;
  t: OrdersListText;
  stage: OrdersFilter | undefined;
  q: string;
  view: OrdersView;
  total: number;
  counts: Record<OrderStage, number>;
  /** Etapas con algún pedido que pide algo a la empresa: llevan un punto naranja. */
  attention: ReadonlySet<OrderStage>;
};

const STAGE_STYLE: Record<OrderStage, { icon: IconName; box: string }> = {
  new: { icon: "sparkle", box: "bg-line-soft text-foreground" },
  "awaiting-inventory": { icon: "link", box: "bg-info-surface text-foreground" },
  "inventory-received": { icon: "orders", box: "bg-primary text-primary-foreground" },
  quoted: { icon: "proposals", box: "bg-background text-foreground" },
  won: { icon: "check", box: "bg-success-surface text-success-foreground" },
  lost: { icon: "close", box: "bg-danger-surface text-danger-foreground" },
};

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function OrdersPipeline({ lang, t, stage, q, view, total, counts, attention }: Props) {
  const { pipeline } = t;
  const allSelected = stage === undefined;

  return (
    <section
      aria-labelledby="pipeline"
      className="flex flex-col gap-4.5 rounded-3xl border border-line bg-surface px-7 py-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="pipeline" className="font-display text-[22px] font-extrabold">
          {pipeline.title}
        </h2>
        <Link
          href={ordersHref(lang, { q, view })}
          aria-current={allSelected ? "true" : undefined}
          className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-bold ${focus} ${allSelected ? "border-foreground bg-foreground text-background" : "border-field-border bg-surface text-foreground"}`}
        >
          {interpolate(pipeline.all, { count: total })}
        </Link>
      </div>
      <div role="group" aria-label={pipeline.filterLabel} className="relative grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2">
        {/* Camino punteado que une las etapas */}
        <span aria-hidden="true" className="absolute inset-x-[6%] top-8.5 border-t-[3px] border-dashed border-line" />
        {ORDER_STAGES.map((key) => {
          const selected = key === stage;
          const { icon, box } = STAGE_STYLE[key];
          return (
            <Link
              key={key}
              // Pulsar la etapa activa quita el filtro
              href={ordersHref(lang, { stage: selected ? undefined : key, q, view })}
              aria-current={selected ? "true" : undefined}
              className={`relative flex flex-col items-center gap-2 rounded-[18px] border-2 px-1.5 pt-1.5 pb-3.5 text-center transition-transform hover:-translate-y-0.5 ${focus} ${selected ? "border-foreground bg-surface-soft" : "border-transparent"}`}
            >
              <span className={`relative grid size-14 place-items-center rounded-[18px] shadow-[0_0_0_6px_var(--surface)] ${box}`}>
                <Icon name={icon} size={key === "lost" ? 22 : 24} strokeWidth={2.2} />
                {attention.has(key) ? (
                  <span className="absolute -top-1 -right-1 size-3.5 rounded-full border-[3px] border-surface bg-primary" />
                ) : null}
              </span>
              <span className="font-display text-[28px] font-extrabold leading-none">{counts[key]}</span>
              <span className={`text-[13px] leading-tight ${selected ? "font-bold text-foreground" : "font-medium text-muted"}`}>
                {pipeline.stages[key]}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
