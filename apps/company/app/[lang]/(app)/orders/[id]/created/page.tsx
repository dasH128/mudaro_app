import type { Metadata } from "next";
import Link from "next/link";
import { lang } from "next/root-params";
import { notFound, redirect } from "next/navigation";

import { Icon } from "@/app/components/app-icon";
import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDate } from "@/app/lib/format";
import { MOCK_COMPANY_SHORT_NAME, MOCK_USER } from "@/app/lib/mock-session";
import { ROUTES, localePath } from "@/app/lib/routes";
import { getOrder } from "@/features/orders/infrastructure/orders.repo";
import { OrderBreadcrumb } from "@/features/orders/presentation/components/order-breadcrumb";
import { OrderStatusTimeline } from "@/features/orders/presentation/components/order-status-timeline";
import { ShareLinkCard } from "@/features/orders/presentation/components/share-link-card";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.orderCreatedTitle };
}

const linkClass =
  "text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. Con datos reales, getOrder solo devuelve pedidos de la empresa (RLS).
export default async function OrderCreatedPage({ params }: PageProps<"/[lang]/orders/[id]/created">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  // Con el inventario rellenado por la empresa no hay enlace que compartir
  if (order.inventoryMode !== "link") redirect(localePath(locale, ROUTES.orders.inventory(order.id)));

  const t = (await getDictionary()).app.orders;
  const flexibility = order.flexibility === "exact" ? "" : ` (${t.new.move.flexibilities[order.flexibility]})`;

  return (
    <div className="mx-auto flex w-full max-w-190 flex-col gap-5">
      <OrderBreadcrumb lang={locale} t={t} current={order.id} />

      <header className="flex items-start gap-4">
        <span className="grid size-13 flex-none place-items-center rounded-full border border-success-border bg-success-surface text-success-foreground">
          <Icon name="check" size={26} strokeWidth={2.5} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
            {interpolate(t.created.title, { id: order.id })}
          </h1>
          <p className="text-base text-muted">
            {order.clientName} · {order.origin} <span aria-hidden="true">→</span>
            <span className="sr-only">{t.created.routeTo}</span> {order.destination} · {formatDate(order.date)}
            {flexibility}
          </p>
        </div>
      </header>

      <ShareLinkCard lang={locale} t={t} order={order} sender={MOCK_USER.name} company={MOCK_COMPANY_SHORT_NAME} />
      <OrderStatusTimeline t={t.created} status={order.status} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={localePath(locale, ROUTES.orders.inventory(order.id))} className={linkClass}>
          {t.created.links.fillInventory}
        </Link>
        <div className="flex flex-wrap gap-4">
          <Link href={localePath(locale, ROUTES.orders.new)} className={linkClass}>
            {t.created.links.createAnother}
          </Link>
          <Link href={localePath(locale, ROUTES.orders.detail(order.id))} className={linkClass}>
            {t.created.links.view}
          </Link>
        </div>
      </div>
    </div>
  );
}
