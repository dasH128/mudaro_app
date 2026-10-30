import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { todayLisbon } from "@/app/lib/format";
import {
  DEFAULT_TAB,
  buildJourney,
  firstMissingMeasure,
  isDetailTab,
  linkState,
  summarizeInventory,
} from "@/features/orders/domain/detail";
import { getOrderDetail } from "@/features/orders/infrastructure/orders.repo";
import { OrderAddressesTab } from "@/features/orders/presentation/components/order-addresses-tab";
import { OrderBreadcrumb } from "@/features/orders/presentation/components/order-breadcrumb";
import { ClientPanel, LinkPanel, NotesPanel } from "@/features/orders/presentation/components/order-detail-side";
import { OrderDetailHeader } from "@/features/orders/presentation/components/order-detail-header";
import { OrderDetailTabs } from "@/features/orders/presentation/components/order-detail-tabs";
import { OrderHistoryTab } from "@/features/orders/presentation/components/order-history-tab";
import { OrderInventoryTab } from "@/features/orders/presentation/components/order-inventory-tab";
import { OrderJourney } from "@/features/orders/presentation/components/order-journey";
import { OrderMeasureAlert } from "@/features/orders/presentation/components/order-measure-alert";
import { OrderProposalsTab } from "@/features/orders/presentation/components/order-proposals-tab";
import { OrderSummaryTab } from "@/features/orders/presentation/components/order-summary-tab";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.orderDetailTitle };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. Con datos reales, getOrderDetail solo devuelve pedidos de la empresa (RLS).
export default async function OrderDetailPage({ params, searchParams }: PageProps<"/[lang]/orders/[id]">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const { id } = await params;
  const tabParam = first((await searchParams).tab);
  const tab = isDetailTab(tabParam) ? tabParam : DEFAULT_TAB;

  // Los datos del pedido, la cuenta atrás de la mudança y la validez del enlace dependen de hoy: se piden en cada petición
  await connection();
  const order = await getOrderDetail(id);
  if (!order) notFound();
  const today = todayLisbon();
  const t = (await getDictionary()).app.orders;

  const totals = order.inventory ? summarizeInventory(order.inventory) : null;
  const missing = order.inventory ? firstMissingMeasure(order.inventory) : null;
  // Con la proposta ya enviada, las medidas que faltan dejan de bloquear
  const blocking = order.stage === "inventory-received" && totals && missing ? { count: totals.missingMeasures, first: missing } : null;

  return (
    <>
      <OrderBreadcrumb lang={locale} t={t} current={order.id} />
      <OrderDetailHeader lang={locale} t={t} order={order} />
      <OrderJourney t={t.detail} items={buildJourney(order.stage, order.events)} />
      {blocking ? (
        <OrderMeasureAlert lang={locale} t={t} clientName={order.client.name} missing={blocking.count} first={blocking.first} />
      ) : null}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-4">
          <OrderDetailTabs
            lang={locale}
            t={t.detail}
            id={order.id}
            current={tab}
            counts={{
              ...(totals ? { inventory: totals.items } : {}),
              addresses: 2,
              proposals: order.proposalCount,
            }}
          />
          {tab === "summary" ? <OrderSummaryTab lang={locale} t={t} order={order} today={today} /> : null}
          {tab === "inventory" ? <OrderInventoryTab lang={locale} t={t} order={order} /> : null}
          {tab === "addresses" ? <OrderAddressesTab t={t} addresses={[order.origin, order.destination]} /> : null}
          {tab === "proposals" ? <OrderProposalsTab lang={locale} t={t} order={order} /> : null}
          {tab === "history" ? <OrderHistoryTab lang={locale} t={t} events={order.events} /> : null}
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <ClientPanel t={t} client={order.client} />
          {order.link ? (
            <LinkPanel
              lang={locale}
              t={t}
              clientName={order.client.name}
              link={order.link}
              state={linkState(order.link, order.stage, today)}
            />
          ) : null}
          <NotesPanel t={t} note={order.note} />
        </div>
      </div>
    </>
  );
}
