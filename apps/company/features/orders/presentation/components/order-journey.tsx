import { Icon } from "@/app/components/app-icon";
import { formatDayMonthTime } from "@/app/lib/format";
import type { JourneyItem } from "../../domain/detail";
import type { OrderDetailText } from "../orders-text";

const DOT = {
  done: "bg-foreground text-background",
  current: "bg-primary text-primary-foreground shadow-[0_0_0_5px_var(--warn-surface)]",
  todo: "border-2 border-dashed border-accent bg-surface text-muted",
};

/** Percurso del pedido: de "Pedido criado" a "Ganho". */
export function OrderJourney({ t, items }: { t: OrderDetailText; items: readonly JourneyItem[] }) {
  const firstTodo = items.findIndex((item) => item.state === "todo");

  return (
    <section aria-label={t.journey.label} className="rounded-3xl border border-line bg-surface px-7 py-5.5">
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          const when = item.at ? formatDayMonthTime(item.at) : index === firstTodo ? t.journey.todo : "";
          return (
            <li key={item.step} aria-current={item.state === "current" ? "step" : undefined} className="flex flex-col gap-2.5">
              <span className="flex items-center gap-2">
                <span className={`grid size-8 flex-none place-items-center rounded-full ${DOT[item.state]}`}>
                  {item.state === "todo" ? (
                    <span className="text-[13px] font-bold">{index + 1}</span>
                  ) : (
                    <Icon name="check" size={16} strokeWidth={3} />
                  )}
                </span>
                {last ? null : <span className={`h-0.75 flex-1 rounded-full ${item.state === "done" ? "bg-foreground" : "bg-line-soft"}`} />}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className={`text-sm ${item.state === "todo" ? "font-medium text-muted" : "font-bold"}`}>{t.journey.steps[item.step]}</span>
                <span className="min-h-4 text-[13px] text-muted">{when}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
