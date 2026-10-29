import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { MOCK_COMPANY_SHORT_NAME, MOCK_USER } from "@/app/lib/mock-session";
import { NewOrderForm } from "@/features/orders/presentation/components/new-order-form";
import { OrderBreadcrumb } from "@/features/orders/presentation/components/order-breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.newOrderTitle };
}

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. La empresa y quien envía el mensaje saldrán de la sesión.
export default async function NewOrderPage() {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const t = (await getDictionary()).app.orders;

  return (
    <>
      <header className="flex flex-col gap-2.5">
        <OrderBreadcrumb lang={locale} t={t} current={t.new.title} />
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">
          {t.new.title}
        </h1>
        <p className="text-base text-muted">{t.new.subtitle}</p>
      </header>
      <NewOrderForm lang={locale} t={t} sender={MOCK_USER.name} company={MOCK_COMPANY_SHORT_NAME} />
    </>
  );
}
