import { getDictionary } from "@/app/i18n/get-dictionary";

// Esqueleto mientras llega la frota (la página es dinámica: matrículas existentes y capacidad de hoy).
export default async function NewVehicleLoading() {
  const t = (await getDictionary()).app.fleet;

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">{t.loading}</span>
      <div className="h-20 animate-pulse rounded-2xl bg-line-soft" />
      <div className="h-96 animate-pulse rounded-3xl bg-line-soft" />
    </div>
  );
}
