import { Icon } from "@/app/components/app-icon";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDate } from "@/app/lib/format";
import type { OrderDetail } from "../../domain/detail";
import type { OrderDetailText } from "../orders-text";

/** Aviso de un pedido cancelado (RF-69): cuándo, quién y por qué. El detalle queda en solo lectura. */
export function OrderCancelledBanner({ t, order }: { t: OrderDetailText["cancelledBanner"]; order: OrderDetail }) {
  if (!order.cancellation) return null;
  const actor = order.events.find((event) => event.kind === "cancelled")?.actor;
  const title = [interpolate(t.title, { date: formatDate(order.cancellation.at) }), actor ? interpolate(t.by, { actor }) : null]
    .filter(Boolean)
    .join(" ");

  return (
    <section role="status" className="flex items-start gap-3.5 rounded-[20px] border border-line bg-surface-soft px-5.5 py-4.5">
      <span className="grid size-9 flex-none place-items-center rounded-full bg-line-soft text-muted">
        <Icon name="close" size={16} strokeWidth={3} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-base font-bold">{title}</span>
        {order.cancellation.reason ? <span className="text-sm">{interpolate(t.reason, { reason: order.cancellation.reason })}</span> : null}
        <span className="text-sm text-muted">{t.hint}</span>
      </span>
    </section>
  );
}
