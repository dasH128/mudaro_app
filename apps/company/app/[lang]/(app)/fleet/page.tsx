import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { pluralize } from "@/app/i18n/interpolate";
import { todayLisbon } from "@/app/lib/format";
import {
  DEFAULT_FILTER,
  DEFAULT_SORT,
  DEFAULT_VIEW,
  arrangeFleet,
  countByFilter,
  fleetAlerts,
  isFilter,
  isSort,
  isView,
  summarize,
} from "@/features/fleet/domain/fleet";
import { getFleetOverview } from "@/features/fleet/infrastructure/fleet.repo";
import { FleetAlertsSection } from "@/features/fleet/presentation/components/fleet-alerts";
import { FleetCards } from "@/features/fleet/presentation/components/fleet-cards";
import { FleetHeader } from "@/features/fleet/presentation/components/fleet-header";
import { FleetTable } from "@/features/fleet/presentation/components/fleet-table";
import { FleetToolbar } from "@/features/fleet/presentation/components/fleet-toolbar";
import { VehiclePanel } from "@/features/fleet/presentation/components/vehicle-panel";
import { fleetHref } from "@/features/fleet/presentation/fleet-href";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.fleetTitle };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// TODO(auth): hasta que exista el rol, el coste por km se muestra siempre. Después, solo administradores (RNF-03).
const CAN_SEE_COST = true;

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. Cuando exista, la página comprueba sesión y rol en servidor.
export default async function FleetPage({ searchParams }: PageProps<"/[lang]/fleet">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const t = (await getDictionary()).app.fleet;

  const params = await searchParams;
  const filterParam = first(params.filter);
  const sortParam = first(params.sort);
  const viewParam = first(params.view);
  const filter = isFilter(filterParam) ? filterParam : DEFAULT_FILTER;
  const sort = isSort(sortParam) ? sortParam : DEFAULT_SORT;
  const view = isView(viewParam) ? viewParam : DEFAULT_VIEW;
  const q = first(params.q)?.trim() ?? "";

  // "Parado há 23 dias", los trabajos de hoy y el gráfico de la semana dependen de hoy
  await connection();
  const today = todayLisbon();
  const { vehicles, metrics } = await getFleetOverview({ today, includeCost: CAN_SEE_COST });

  const arranged = arrangeFleet(vehicles, { filter, q, sort }, today);

  // El vehículo abierto sigue visible aunque el filtro lo excluya: se añade al final, como en el diseño
  const requested = first(params.vehicle);
  const opened = vehicles.find((v) => v.id === requested);
  const order = opened && !arranged.all.includes(opened) ? [...arranged.all, opened] : arranged.all;
  const index = opened ? order.indexOf(opened) : -1;

  const base = { filter, q, sort, view };
  const hrefFor = (position: number) => fleetHref(locale, { ...base, vehicle: order[(position + order.length) % order.length]?.id });
  const emptyMessage = q !== "" ? t.table.emptySearch : t.table.emptyFilter;

  return (
    <>
      <FleetHeader lang={locale} t={t} summary={summarize(vehicles)} />
      <FleetAlertsSection lang={locale} t={t} alerts={fleetAlerts(vehicles, metrics, today)} showCost={CAN_SEE_COST} />
      <FleetToolbar
        lang={locale}
        t={t}
        filter={filter}
        q={q}
        sort={sort}
        view={view}
        vehicle={opened?.id}
        counts={countByFilter(vehicles, today)}
      />

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {view === "list" ? (
            <FleetTable
              lang={locale}
              t={t}
              active={arranged.active}
              inactive={arranged.inactive}
              selectedId={opened?.id}
              params={base}
              today={today}
              compact={opened !== undefined}
              emptyMessage={emptyMessage}
            />
          ) : (
            <FleetCards
              lang={locale}
              t={t}
              vehicles={arranged.all}
              selectedId={opened?.id}
              params={base}
              today={today}
              emptyMessage={emptyMessage}
            />
          )}
          <p className="sr-only" aria-live="polite">
            {pluralize(locale, arranged.all.length, t.resultsCount)}
          </p>
        </div>

        {opened ? (
          <VehiclePanel
            lang={locale}
            t={t}
            vehicle={opened}
            today={today}
            position={index + 1}
            total={order.length}
            previousHref={hrefFor(index - 1)}
            nextHref={hrefFor(index + 1)}
            closeHref={fleetHref(locale, base)}
            showCost={CAN_SEE_COST}
          />
        ) : null}
      </div>
    </>
  );
}
