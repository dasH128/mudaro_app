import { Icon } from "@/app/components/app-icon";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import type { Locale } from "@/app/i18n/config";
import { firstName } from "../../domain/client-name";
import type { InventoryLine } from "../../domain/detail";
import type { OrdersText } from "../orders-text";

const soon = "disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type Props = { lang: Locale; t: OrdersText; clientName: string; missing: number; first: InventoryLine };

/** Aviso de objetos sin medidas: sin ellas no se puede orçamentar. */
export function OrderMeasureAlert({ lang, t, clientName, missing, first }: Props) {
  const d = t.detail.alert;
  const name = firstName(clientName);
  const text = missing === 1 ? interpolate(d.textOne, { name, item: first.name }) : interpolate(d.textMany, { name });

  return (
    <section
      aria-labelledby="measures"
      className="flex flex-wrap items-center gap-x-5 gap-y-3.5 rounded-[20px] border border-warn-border bg-warn-surface px-5.5 py-4.5"
    >
      <span className="grid size-11 flex-none place-items-center rounded-[14px] bg-warn-border/40 text-warn-foreground">
        <Icon name="ruler" size={22} />
      </span>
      <div className="flex flex-[1_1_320px] flex-col gap-0.5">
        <h2 id="measures" className="text-base font-bold">
          {pluralize(lang, missing, d.title)}
        </h2>
        <p className="text-sm text-warn-foreground">{text}</p>
      </div>
      {/* TODO: estimar medidas y pedirlas al cliente aún no tienen diseño de flujo */}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled title={t.list.soon} className={`h-10 rounded-full px-4 text-sm font-bold underline ${soon}`}>
          {d.estimate}
        </button>
        <button type="button" disabled title={t.list.soon} className={`h-10 rounded-full border border-field-border bg-surface px-4 text-sm font-bold ${soon}`}>
          {d.ask}
        </button>
      </div>
    </section>
  );
}
