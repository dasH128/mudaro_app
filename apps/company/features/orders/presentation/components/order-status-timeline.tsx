import { ORDER_STATUSES, type OrderStatus } from "@/features/orders/domain/types";
import type { CreatedText } from "../orders-text";

/** Barra de progreso del ciclo de vida del pedido. Lo ya alcanzado va en tinta. */
export function OrderStatusTimeline({ t, status }: { t: CreatedText; status: OrderStatus }) {
  const current = ORDER_STATUSES.indexOf(status);

  return (
    <section aria-labelledby="status" className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6">
      <h2 id="status" className="font-display text-xl font-extrabold">
        {t.statusTitle}
      </h2>
      <ol className="grid gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
        {ORDER_STATUSES.map((step, index) => {
          const reached = index <= current;
          return (
            <li key={step} aria-current={index === current ? "step" : undefined} className="flex flex-col gap-2">
              <span className={`h-1.5 rounded-full ${reached ? "bg-foreground" : "bg-line"}`} />
              <span className={`text-sm ${reached ? "font-bold" : "font-medium text-muted"}`}>{t.steps[step]}</span>
              {index === current ? <span className="text-xs text-muted">{t.now}</span> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
