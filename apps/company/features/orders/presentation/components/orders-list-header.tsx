import Form from "next/form";
import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { OrdersFilter, OrdersView } from "../../domain/list";
import type { OrdersListText } from "../orders-text";

type Props = { lang: Locale; t: OrdersListText; q: string; stage: OrdersFilter | undefined; view: OrdersView };

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function OrdersListHeader({ lang, t, q, stage, view }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">
          {t.title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* GET a la misma ruta: la búsqueda viaja en la URL y conserva etapa y vista */}
        <Form action={localePath(lang, ROUTES.orders.list)}>
          {stage ? <input type="hidden" name="stage" value={stage} /> : null}
          {view !== "cards" ? <input type="hidden" name="view" value={view} /> : null}
          <label className="flex h-12 w-80 max-w-full items-center gap-2.5 rounded-full border border-line bg-surface px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
            <Icon name="search" size={18} className="text-muted" />
            <span className="sr-only">{t.searchLabel}</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-field-placeholder"
            />
          </label>
        </Form>
        <Link
          href={localePath(lang, ROUTES.orders.new)}
          className={`flex h-12 items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground shadow-md ${focus}`}
        >
          <Icon name="plus" size={18} strokeWidth={2.5} />
          {t.new}
        </Link>
      </div>
    </header>
  );
}
