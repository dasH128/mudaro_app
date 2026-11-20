import { getDictionary } from "@/app/i18n/get-dictionary";

// Esqueleto mientras se comprueba la sesión.
export default async function NewPersonLoading() {
  const t = (await getDictionary()).app.team;

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">{t.loading}</span>
      <div className="h-20 animate-pulse rounded-2xl bg-line-soft" />
      <div className="h-96 max-w-xl animate-pulse rounded-3xl bg-line-soft" />
    </div>
  );
}
