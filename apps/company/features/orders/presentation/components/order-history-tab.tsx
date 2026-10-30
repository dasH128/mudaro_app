import type { Locale } from "@/app/i18n/config";
import type { OrderEvent } from "../../domain/detail";
import { describeEvent } from "../detail-text";
import type { OrdersText } from "../orders-text";
import { card, sectionTitle } from "./order-detail-parts";

const DOT = { primary: "bg-primary", ink: "bg-foreground", accent: "bg-accent" };

/** Pestaña Histórico: del evento más reciente al más antiguo. */
export function OrderHistoryTab({ lang, t, events }: { lang: Locale; t: OrdersText; events: readonly OrderEvent[] }) {
  return (
    <section aria-labelledby="history" className={`${card} gap-1`}>
      <h2 id="history" className={`${sectionTitle} mb-3`}>
        {t.detail.history.title}
      </h2>
      <ol className="flex flex-col">
        {events.map((event) => {
          const text = describeEvent(event, t, lang);
          return (
            <li key={`${event.kind}-${event.at}`} className="flex gap-3.5">
              <span className="flex flex-col items-center">
                <span className={`mt-1 size-3 rounded-full ${DOT[text.tone]}`} />
                <span className="my-1 w-0.5 flex-1 bg-line-soft" />
              </span>
              <span className="flex flex-col gap-0.5 pb-5 text-sm">
                <strong>{text.title}</strong>
                <span className="text-muted">{text.meta}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
