import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { isWarn, nextAction } from "../../domain/list";
import type { OrderListItem } from "../../domain/types";
import { describeNote, describeWhen, type OrdersListText } from "../orders-text";
import { OrderActionButton } from "./order-action";
import { OrderAvatar } from "./order-avatar";
import { OrderIdLink } from "./order-id-link";
import { OrderStagePill } from "./order-stage-pill";

type Props = { lang: Locale; t: OrdersListText; items: readonly OrderListItem[]; today: string };

/** "Precisam de ti": tarjetas de los pedidos que esperan algo de la empresa. */
export function UrgentOrders({ lang, t, items, today }: Props) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="urgent" className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <h2 id="urgent" className="font-display text-2xl font-extrabold">
          {t.urgent.title}
        </h2>
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground">
          {items.length}
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
        {items.map((item, index) => {
          const warn = isWarn(item.note);
          const action = nextAction(item.note);
          const when = describeWhen(item, t, lang, today);
          return (
            <article
              key={item.id}
              className="relative flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <OrderAvatar name={item.client} index={index} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-bold">{item.client}</span>
                  <OrderIdLink lang={lang} id={item.id} />
                </div>
                <OrderStagePill stage={item.stage} label={t.status[item.stage]} />
              </div>
              <div
                className={`flex items-start gap-2.5 rounded-[14px] px-3.5 py-3 text-sm leading-[1.45] ${warn ? "bg-warn-surface text-warn-foreground" : "bg-surface-head text-foreground"}`}
              >
                <span
                  className={`-mt-0.75 grid size-7 flex-none place-items-center rounded-full ${warn ? "bg-warn-border/40 text-warn-foreground" : "bg-surface text-foreground"}`}
                >
                  <Icon name={warn ? "clock" : "orders"} size={16} strokeWidth={2.2} />
                </span>
                <span>{describeNote(item.note, t, lang, today)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <span className="size-2.5 rounded-full border-2 border-foreground" />
                {item.from}
                <Icon name="arrowRight" size={16} className="text-accent" />
                <span className="size-2.5 rounded-full bg-primary" />
                {item.to}
                <span className="sr-only">{t.common.routeTo}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-3.5">
                <span className="inline-flex items-center gap-2 text-[13px] text-muted">
                  <Icon name="calendar" size={16} />
                  <span>
                    <strong className="text-foreground">{when.date}</strong> · {when.countdown}
                  </span>
                </span>
                {action ? (
                  <span className="relative">
                    <OrderActionButton lang={lang} t={t} id={item.id} action={action} size="card" />
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
