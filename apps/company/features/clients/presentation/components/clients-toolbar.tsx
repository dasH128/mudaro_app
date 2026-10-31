import Form from "next/form";
import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import { SortSelect } from "@/app/components/form/sort-select";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { CHIP_FILTERS, DEFAULT_FILTER, SORTS, type ClientFilter, type ClientSort, type ClientSummaryCounts } from "../../domain/clients";
import { clientsHref } from "../clients-href";
import type { ClientsText } from "../clients-text";
import { focusRing } from "./clients-parts";

type Props = {
  lang: Locale;
  t: ClientsText;
  filter: ClientFilter;
  q: string;
  sort: ClientSort;
  client: string | undefined;
  counts: ClientSummaryCounts;
};

const chip = `inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold ${focusRing}`;
const field =
  "flex h-10 items-center rounded-full border border-status-off-border px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary";

/** Filtros, búsqueda y orden. Todo viaja en la URL (enlaces y un formulario GET). */
export function ClientsToolbar({ lang, t, filter, q, sort, client, counts }: Props) {
  const tb = t.toolbar;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-full border border-line bg-surface p-2">
      <div role="group" aria-label={tb.filterLabel} className="inline-flex flex-wrap gap-1">
        {CHIP_FILTERS.map((key) => {
          const selected = key === filter;
          return (
            <Link
              key={key}
              href={clientsHref(lang, { filter: key, q, sort, client })}
              scroll={false}
              aria-current={selected ? "true" : undefined}
              className={`${chip} ${selected ? "border-foreground bg-foreground text-background" : "border-transparent text-foreground hover:bg-surface-soft"}`}
            >
              {tb.filters[key]} <span className="opacity-70">{counts[key]}</span>
            </Link>
          );
        })}
        {/* "Voltaram" no tiene pastilla propia: se llega desde el aviso. Mientras está activo, se muestra aquí. */}
        {filter === "returned" ? (
          <span aria-current="true" className={`${chip} border-foreground bg-foreground text-background`}>
            {tb.filters.returned} <span className="opacity-70">{counts.returned}</span>
          </span>
        ) : null}
      </div>

      {/* GET a la misma ruta: conserva el filtro y el cliente abierto */}
      <Form action={localePath(lang, ROUTES.clients)} className="flex flex-wrap items-center gap-2">
        {filter !== DEFAULT_FILTER ? <input type="hidden" name="filter" value={filter} /> : null}
        {client ? <input type="hidden" name="client" value={client} /> : null}
        <label className={`${field} w-52 gap-2`}>
          <Icon name="search" size={16} className="text-muted" />
          <span className="sr-only">{tb.searchLabel}</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={tb.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-field-placeholder"
          />
        </label>
        <label className={`${field} gap-1.5 text-[13px]`}>
          <span className="text-muted">{tb.sortLabel}</span>
          <SortSelect name="sort" value={sort} options={SORTS.map((value) => ({ value, label: tb.sort[value] }))} />
        </label>
      </Form>
    </div>
  );
}
