import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";
import { getActiveExtras, getCatalog } from "@/features/inventory/infrastructure/inventory.repo";
import { InventoryEditor } from "@/features/inventory/presentation/components/inventory-editor";
import { getOrder } from "@/features/orders/infrastructure/orders.repo";
import { OrderBreadcrumb } from "@/features/orders/presentation/components/order-breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.orderInventoryTitle };
}

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. Con datos reales, getOrder solo devuelve pedidos de la empresa (RLS).
export default async function OrderInventoryPage({ params }: PageProps<"/[lang]/orders/[id]/inventory">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const [dict, catalog, extras] = await Promise.all([getDictionary(), getCatalog(), getActiveExtras()]);
  const t = dict.app.orders;
  const detailHref = localePath(locale, ROUTES.orders.detail(order.id));

  return (
    <>
      <OrderBreadcrumb
        lang={locale}
        t={t}
        current={t.inventory.breadcrumb}
        parent={{ label: order.id, href: detailHref }}
      />
      <InventoryEditor
        lang={locale}
        t={t.inventory}
        order={{
          clientName: order.clientName,
          origin: order.origin,
          destination: order.destination,
          date: order.date,
          linkLocked: order.inventoryMode === "link",
        }}
        catalog={catalog}
        extras={extras}
        exitHref={detailHref}
      />
    </>
  );
}
