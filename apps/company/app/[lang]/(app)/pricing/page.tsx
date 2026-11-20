import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { Icon } from "@/app/components/app-icon";
import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDate } from "@/app/lib/format";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { getExtraTypes } from "@/features/inventory/infrastructure/inventory.repo";
import { getCompanyExtras, getCurrentTariff } from "@/features/pricing/infrastructure/pricing.repo";
import { ExtrasPanel } from "@/features/pricing/presentation/components/extras-panel";
import { TariffForm } from "@/features/pricing/presentation/components/tariff-form";
import { tariffValues } from "@/features/pricing/presentation/pricing-text";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.pricingTitle };
}

// Tarifas (RF-06, RF-07). Solo los administradores entran en el panel (requireCompanySession) y la RLS solo les deja leer
// la tarifa, que lleva costes (RNF-03).
export default async function PricingPage() {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  await requireCompanySession(locale);

  const [t, tariff, extras, types] = await Promise.all([
    getDictionary().then((dict) => dict.app.pricing),
    getCurrentTariff(),
    getCompanyExtras(),
    getExtraTypes(locale),
  ]);
  // La base crea la tarifa v1 al dar de alta la empresa: sin ella algo está mal configurado.
  if (!tariff) throw new Error("pricing: la empresa no tiene tarifa");

  return (
    <>
      <header className="flex flex-col gap-2.5">
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{t.title}</h1>
        <p className="max-w-180 text-base text-muted">{t.subtitle}</p>
        <span className="inline-flex h-8.5 w-fit items-center rounded-full border border-line bg-surface px-3 text-[13px]">
          {interpolate(t.version, { version: tariff.version, date: formatDate(tariff.validFrom) })}
        </span>
        {tariff.version === 1 ? (
          <p className="flex max-w-180 items-start gap-2.5 rounded-xl bg-warn-surface px-4 py-3 text-sm">
            <Icon name="info" size={18} className="mt-px flex-none" />
            {t.defaultsNote}
          </p>
        ) : null}
      </header>

      <div className="flex flex-wrap items-start gap-5">
        {/* Tras guardar, el formulario ya muestra los valores guardados: no se reinicia, así se ve el aviso de la versión nueva */}
        <TariffForm lang={locale} t={t} initial={tariffValues(tariff)} />
        <ExtrasPanel lang={locale} t={t} extras={extras} types={types} />
      </div>
    </>
  );
}
