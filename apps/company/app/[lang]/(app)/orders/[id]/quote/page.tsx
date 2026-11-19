import type { Metadata } from "next";
import Link from "next/link";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { interpolate } from "@/app/i18n/interpolate";
import { todayLisbon } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { getExtraTypes } from "@/features/inventory/infrastructure/inventory.repo";
import { OrderBreadcrumb } from "@/features/orders/presentation/components/order-breadcrumb";
import { getQuoteEditorData } from "@/features/quotes/infrastructure/quotes.repo";
import { QuoteEditor } from "@/features/quotes/presentation/components/quote-editor";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.quoteEditorTitle };
}

/** aaaa-mm-dd + días → dd/mm/aaaa (RNF-10). */
function addDaysPt(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  const [y, m, d] = date.toISOString().slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// Editor de orçamento (RF-35 a RF-42). Solo administradores (requireCompanySession); la RLS solo les deja leer la
// tarifa, los costes y los orçamentos de su empresa (RNF-01, RNF-03).
export default async function QuoteEditorPage({ params }: PageProps<"/[lang]/orders/[id]/quote">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  await requireCompanySession(locale);
  await connection();

  const { id } = await params;
  const [data, dict, extraTypes] = await Promise.all([getQuoteEditorData(id), getDictionary(), getExtraTypes(locale)]);
  if (!data) notFound();

  const t = dict.app.orders;
  const e = dict.app.quotes.editor;
  const detailHref = localePath(locale, ROUTES.orders.detail(data.order.id));
  const blocked = !data.inventory ? e.noInventory : data.order.status === "won" ? e.won : null;

  return (
    <>
      <OrderBreadcrumb lang={locale} t={t} current={dict.app.quotes.columns.quote} parent={{ label: data.order.id, href: detailHref }} />
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">{interpolate(e.title, { name: data.order.clientName })}</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="inline-flex h-6.5 items-center rounded-full bg-status-config-surface px-2.5 text-xs font-bold text-foreground">
            {data.draftNumber
              ? interpolate(e.numbered, { number: String(data.draftNumber).padStart(4, "0"), version: data.draftVersion })
              : interpolate(e.numberPending, { version: data.draftVersion })}
          </span>
          {data.inventory ? <span>{interpolate(e.basedOn, { version: data.inventory.version })}</span> : null}
          <span>{data.order.route.filter(Boolean).join(" → ")}</span>
        </p>
        {data.last && data.last.status !== "draft" && !blocked ? (
          <p className="text-sm">
            {interpolate(e.lastStatus, { version: data.last.version, status: e.statuses[data.last.status as keyof typeof e.statuses] ?? data.last.status })}
          </p>
        ) : null}
      </header>

      {blocked ? (
        <section className="flex max-w-140 flex-col items-start gap-3 rounded-3xl border border-line bg-surface p-7">
          <h2 className="font-display text-2xl font-extrabold">{blocked.title}</h2>
          <p className="text-[15px] text-muted">{blocked.text}</p>
          <Link href={detailHref} className="text-sm font-bold underline">
            {e.back}
          </Link>
        </section>
      ) : (
        <QuoteEditor
          lang={locale}
          t={e}
          data={data}
          extraTypes={extraTypes}
          defaultValidUntil={addDaysPt(todayLisbon(), data.tariff.quoteValidityDays)}
        />
      )}
    </>
  );
}
