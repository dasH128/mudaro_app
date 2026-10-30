import { getDictionary } from "@/app/i18n/get-dictionary";

// Esqueleto mientras llega la lista (la página es dinámica: filtros en la URL y fecha de hoy).
export default async function OrdersLoading() {
  const t = (await getDictionary()).app.orders.list;

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">{t.loading}</span>
      <div className="h-14 animate-pulse rounded-2xl bg-line-soft" />
      <div className="h-48 animate-pulse rounded-3xl bg-line-soft" />
      <div className="h-44 animate-pulse rounded-3xl bg-line-soft" />
      <div className="h-96 animate-pulse rounded-2xl bg-line-soft" />
    </div>
  );
}
