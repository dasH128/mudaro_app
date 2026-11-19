import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { hasLocale, type Locale } from "@/app/i18n/config";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { InventoryEditorData } from "@/features/inventory/domain/types";
import { getCatalog, getExtraTypes, getInventoryEditor } from "@/features/inventory/infrastructure/inventory.repo";
import type { InventoryText } from "@/features/inventory/presentation/inventory-text";
import { InventoryEditor, type InventoryOrder } from "@/features/inventory/presentation/components/inventory-editor";
import { InventorySubmitted } from "@/features/inventory/presentation/components/inventory-submitted";
import { getOrder } from "@/features/orders/infrastructure/orders.repo";
import { OrderBreadcrumb } from "@/features/orders/presentation/components/order-breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.orderInventoryTitle };
}

// Con datos reales, getOrder y getInventoryEditor solo devuelven pedidos de la empresa (RLS).
export default async function OrderInventoryPage({ params }: PageProps<"/[lang]/orders/[id]/inventory">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  await requireCompanySession(locale);

  const { id } = await params;
  const [order, editor] = await Promise.all([getOrder(id), getInventoryEditor(id)]);
  if (!order || !editor) notFound();

  const dict = await getDictionary();
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
      {editor.kind === "submitted" ? (
        <InventorySubmitted
          lang={locale}
          t={t.inventory}
          orderId={order.id}
          version={editor.version}
          submittedAt={editor.submittedAt}
          detailHref={detailHref}
        />
      ) : (
        <InventoryEditorLoader
          locale={locale}
          t={t.inventory}
          orderId={order.id}
          order={{
            clientName: order.clientName,
            origin: order.origin,
            destination: order.destination,
            date: order.date,
            linkLocked: order.inventoryMode === "link",
          }}
          editor={editor}
          exitHref={detailHref}
        />
      )}
    </>
  );
}

type LoaderProps = {
  locale: Locale;
  t: InventoryText;
  orderId: string;
  order: InventoryOrder;
  editor: Extract<InventoryEditorData, { kind: "draft" }>;
  exitHref: string;
};

/** El catálogo solo se lee si hay borrador que editar. */
async function InventoryEditorLoader({ locale, t, orderId, order, editor, exitHref }: LoaderProps) {
  const [catalog, extras] = await Promise.all([getCatalog(locale), getExtraTypes(locale)]);
  return (
    <InventoryEditor
      lang={locale}
      t={t}
      orderId={orderId}
      order={order}
      version={editor.version}
      rooms={catalog.rooms}
      catalog={catalog.items}
      extras={extras}
      points={editor.points}
      initial={editor.draft}
      exitHref={exitHref}
    />
  );
}
