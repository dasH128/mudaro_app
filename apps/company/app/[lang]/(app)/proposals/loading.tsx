import { getDictionary } from "@/app/i18n/get-dictionary";

// Esqueleto mientras llegan los datos de la lista (la página es dinámica: filtros en la URL y fecha de hoy).
export default async function ProposalsLoading() {
  const t = (await getDictionary()).app.proposals;

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">{t.loading}</span>
      <div className="h-24 animate-pulse rounded-2xl bg-line-soft" />
      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-30 animate-pulse rounded-2xl bg-line-soft" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-line-soft" />
    </div>
  );
}
