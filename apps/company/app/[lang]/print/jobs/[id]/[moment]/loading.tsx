import { getDictionary } from "@/app/i18n/get-dictionary";

// Esqueleto mientras llega el trabajo (la página es dinámica: sesión y datos de la agenda).
export default async function JobPrintLoading() {
  const t = (await getDictionary()).app.jobs;

  return (
    <div role="status" aria-busy="true" className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <span className="sr-only">{t.loading}</span>
      <div className="h-16 animate-pulse rounded-2xl bg-line-soft" />
      <div className="h-96 animate-pulse rounded-2xl bg-line-soft" />
    </div>
  );
}
