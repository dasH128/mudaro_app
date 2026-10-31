// Esqueleto mientras llega Início (la página es dinámica: muestra la fecha de hoy).
export default function DashboardLoading() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <div className="h-24 animate-pulse rounded-[20px] bg-line-soft" />
      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-30 animate-pulse rounded-[20px] bg-line-soft" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-3xl bg-line-soft" />
    </div>
  );
}
