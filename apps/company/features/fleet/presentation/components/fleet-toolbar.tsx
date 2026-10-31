import Form from "next/form";
import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import { SortSelect } from "@/app/components/form/sort-select";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import {
  DEFAULT_FILTER,
  FILTERS,
  SORTS,
  VIEWS,
  type FleetFilter,
  type FleetSort,
  type FleetView,
} from "../../domain/fleet";
import { fleetHref } from "../fleet-href";
import type { FleetText } from "../fleet-text";
import { focusRing } from "./fleet-parts";

type Props = {
  lang: Locale;
  t: FleetText;
  filter: FleetFilter;
  q: string;
  sort: FleetSort;
  view: FleetView;
  vehicle: string | undefined;
  counts: Record<FleetFilter, number>;
};

const chip = `inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold ${focusRing}`;
const field =
  "flex h-10 items-center rounded-full border border-status-off-border px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary";

/** Filtros, búsqueda, orden y vista. Todo viaja en la URL (enlaces y un formulario GET). */
export function FleetToolbar({ lang, t, filter, q, sort, view, vehicle, counts }: Props) {
  const tb = t.toolbar;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-full border border-line bg-surface p-2">
      <div role="group" aria-label={tb.filterLabel} className="inline-flex flex-wrap gap-1">
        {FILTERS.map((key) => {
          const selected = key === filter;
          return (
            <Link
              key={key}
              href={fleetHref(lang, { filter: key, q, sort, view, vehicle })}
              scroll={false}
              aria-current={selected ? "true" : undefined}
              className={`${chip} ${selected ? "border-foreground bg-foreground text-background" : "border-transparent text-foreground hover:bg-surface-soft"}`}
            >
              {tb.filters[key]} <span className="opacity-70">{counts[key]}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* GET a la misma ruta: conserva filtro, vista y vehículo abierto */}
        <Form action={localePath(lang, ROUTES.fleet.list)} className="flex flex-wrap items-center gap-2">
          {filter !== DEFAULT_FILTER ? <input type="hidden" name="filter" value={filter} /> : null}
          {view !== "list" ? <input type="hidden" name="view" value={view} /> : null}
          {vehicle ? <input type="hidden" name="vehicle" value={vehicle} /> : null}
          <label className={`${field} w-52.5 gap-2`}>
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

        <div role="group" aria-label={tb.view.label} className="inline-flex gap-1 rounded-full bg-surface-head p-1">
          {VIEWS.map((key) => {
            const selected = key === view;
            return (
              <Link
                key={key}
                href={fleetHref(lang, { filter, q, sort, view: key, vehicle })}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                aria-label={tb.view[key]}
                title={tb.view[key]}
                className={`grid size-8.5 place-items-center rounded-full ${focusRing} ${selected ? "bg-foreground text-background" : "text-foreground"}`}
              >
                <Icon name={key === "list" ? "list" : "grid"} size={16} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
