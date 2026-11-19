import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { formatDate } from "@mudaro/validation";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { interpolate } from "@/app/i18n/interpolate";
import { isLinkToken } from "@/features/order/domain/types";
import { getClientOrder } from "@/features/order/infrastructure/client-order.repo";
import { ClientInventoryEditor } from "@/features/order/presentation/components/client-inventory-editor";
import { ClientBrand, OrderHeader, StatusCard } from "@/features/order/presentation/components/order-status";
import { QuoteView } from "@/features/order/presentation/components/quote-view";
import { firstName } from "@/features/order/domain/types";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.linkTitle };
}

// Enlace del pedido (RF-15): el cliente rellena el inventario sin cuenta. Quién puede ver qué lo decide la Edge
// Function `client-order` con el token; esta página no tiene sesión que comprobar.
export default async function OrderLinkPage({ params }: PageProps<"/[lang]/p/[token]">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  const t = await getDictionary();
  const { token } = await params;

  const view = isLinkToken(token) ? await getClientOrder(token, locale) : null;

  if (!view) {
    return (
      <>
        <ClientBrand />
        <StatusCard icon="alert" tone="danger" title={t.link.invalidTitle} text={t.link.invalidText} />
      </>
    );
  }

  const company = { company: view.order.companyName };

  // Con un orçamento enviado, el cliente ve el orçamento (RF-41) en lugar del inventario
  if (view.quote) {
    return (
      <>
        <ClientBrand />
        <header className="flex flex-col gap-2 print:hidden">
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
            {interpolate(t.header.quoteTitle, { name: firstName(view.order.contactName) })}
          </h1>
        </header>
        <QuoteView t={t} token={token} order={view.order} quote={view.quote} />
      </>
    );
  }

  return (
    <>
      <ClientBrand />
      <OrderHeader t={t} order={view.order} state={view.kind} />
      {view.kind === "draft" ? (
        <ClientInventoryEditor
          lang={locale}
          t={t.inventory}
          token={token}
          rooms={view.rooms}
          catalog={view.catalog}
          extras={view.extras}
          points={view.points}
          initial={view.draft}
        />
      ) : view.kind === "submitted" ? (
        <StatusCard
          icon="check"
          tone="success"
          title={t.submitted.title}
          text={interpolate(t.submitted.text, { ...company, when: formatDate(view.submittedAt) })}
        >
          <span className="text-xs text-muted">{interpolate(t.submitted.version, { version: view.version })}</span>
        </StatusCard>
      ) : (
        <StatusCard icon="clock" tone="warn" title={t.expired.title} text={interpolate(t.expired.text, company)} />
      )}
    </>
  );
}
