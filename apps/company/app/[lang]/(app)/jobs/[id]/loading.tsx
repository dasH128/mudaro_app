import { getDictionary } from "@/app/i18n/get-dictionary";

// Esqueleto mientras llega el trabajo.
export default async function JobLoading() {
  const t = (await getDictionary()).app.jobs;

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">{t.loading}</span>
      <div className="h-28 animate-pulse rounded-2xl bg-line-soft" />
      <div className="flex flex-wrap gap-5">
        <div className="h-96 flex-[999_1_520px] animate-pulse rounded-3xl bg-line-soft" />
        <div className="h-96 flex-[1_1_340px] animate-pulse rounded-3xl bg-line-soft" />
      </div>
    </div>
  );
}
