import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { todayLisbon } from "@/app/lib/format";
import {
  DEFAULT_FILTER,
  DEFAULT_SORT,
  arrangeClients,
  clientAlerts,
  countByFilter,
  isFilter,
  isSort,
} from "@/features/clients/domain/clients";
import { getClientsOverview } from "@/features/clients/infrastructure/clients.repo";
import { ClientPanel } from "@/features/clients/presentation/components/client-panel";
import { ClientsAlertsSection } from "@/features/clients/presentation/components/clients-alerts";
import { ClientsHeader } from "@/features/clients/presentation/components/clients-header";
import { ClientsTable } from "@/features/clients/presentation/components/clients-table";
import { ClientsToolbar } from "@/features/clients/presentation/components/clients-toolbar";
import { clientsHref } from "@/features/clients/presentation/clients-href";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.clientsTitle };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// TODO(auth): hasta que exista el rol, los importes aceptados se muestran siempre. Después, solo administradores (RNF-03).
const CAN_SEE_VALUES = true;

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. Cuando exista, la página comprueba sesión y rol en servidor.
export default async function ClientsPage({ searchParams }: PageProps<"/[lang]/clients">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const t = (await getDictionary()).app.clients;

  const params = await searchParams;
  const filterParam = first(params.filter);
  const sortParam = first(params.sort);
  const filter = isFilter(filterParam) ? filterParam : DEFAULT_FILTER;
  const sort = isSort(sortParam) ? sortParam : DEFAULT_SORT;
  const q = first(params.q)?.trim() ?? "";

  // "Amanhã", "há 5 dias" y los avisos dependen de hoy
  await connection();
  const today = todayLisbon();
  const { clients } = await getClientsOverview({ today, includeValues: CAN_SEE_VALUES });

  const arranged = arrangeClients(clients, { filter, q, sort });

  // El cliente abierto sigue visible aunque el filtro lo excluya: se añade al final, como en el diseño
  const requested = first(params.client);
  const opened = clients.find((c) => c.id === requested);
  const order = opened && !arranged.includes(opened) ? [...arranged, opened] : arranged;
  const index = opened ? order.indexOf(opened) : -1;

  const base = { filter, q, sort };
  const hrefFor = (position: number) => clientsHref(locale, { ...base, client: order[(position + order.length) % order.length]?.id });
  const counts = countByFilter(clients);

  return (
    <>
      <ClientsHeader lang={locale} t={t} counts={counts} />
      <ClientsAlertsSection lang={locale} t={t} alerts={clientAlerts(clients, today)} />
      <ClientsToolbar lang={locale} t={t} filter={filter} q={q} sort={sort} client={opened?.id} counts={counts} />

      <div className="flex flex-wrap items-start gap-6">
        <ClientsTable
          lang={locale}
          t={t}
          clients={arranged}
          total={clients.length}
          selectedId={opened?.id}
          params={base}
          today={today}
          compact={opened !== undefined}
          showValues={CAN_SEE_VALUES}
          emptyMessage={q !== "" ? t.table.emptySearch : t.table.emptyFilter}
        />

        {opened ? (
          <ClientPanel
            key={opened.id}
            lang={locale}
            t={t}
            client={opened}
            today={today}
            position={index + 1}
            total={order.length}
            previousHref={hrefFor(index - 1)}
            nextHref={hrefFor(index + 1)}
            closeHref={clientsHref(locale, base)}
            showValues={CAN_SEE_VALUES}
          />
        ) : null}
      </div>
    </>
  );
}
