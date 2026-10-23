import { TOTAL_PASSOS } from "@/features/empresas/domain/estado";

export function ProgressBar({ done }: { done: number }) {
  const complete = done >= TOTAL_PASSOS;
  return (
    <div className="flex items-center gap-2.5">
      <div aria-hidden="true" className="h-1.5 w-20 overflow-hidden rounded-[3px] bg-line-soft">
        <div
          className={`h-full ${complete ? "bg-foreground" : "bg-primary"}`}
          style={{ width: `${(done / TOTAL_PASSOS) * 100}%` }}
        />
      </div>
      <span className="text-[13px] text-muted">
        {done} de {TOTAL_PASSOS}
      </span>
    </div>
  );
}
