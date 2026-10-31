import { getDictionary } from "@/app/i18n/get-dictionary";

// Esqueleto mientras llegan los datos de la lista (la página es dinámica: filtros en la URL y fecha de hoy).
export default async function ProposalsLoading() {
  const t = (await getDictionary()).app.proposals;

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">{t.loading}</span>
      <div className="h-24 animate-pulse rounded-2xl bg-line-soft" />
      <div className="h-28 animate-pulse rounded-3xl bg-line-soft" />
      <div className="h-14 animate-pulse rounded-full bg-line-soft" />
      <div className="h-96 animate-pulse rounded-3xl bg-line-soft" />
    </div>
  );
}
