import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { Stage } from "@/features/dashboard/domain/types";

const TONES: Record<Stage["tone"], string> = {
  neutral: "border-line-soft bg-surface-soft",
  warn: "border-warn-border bg-warn-surface",
  success: "border-success-border bg-success-surface",
};

export function Pipeline({ lang, stages }: { lang: Locale; stages: readonly Stage[] }) {
  return (
    <section
      aria-labelledby="pipeline"
      className="flex flex-col gap-[18px] rounded-2xl border border-line bg-surface p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1">
          <h2 id="pipeline" className="font-display text-[22px] font-extrabold">
            Pedidos em andamento
          </h2>
          <p className="text-sm text-muted">
            Do primeiro contacto à proposta aceite. 2 inventários à espera de orçamento.
          </p>
        </div>
        <Link href={localePath(lang, ROUTES.orders.list)} className="flex items-center gap-1.5 text-sm font-bold">
          Ver pedidos
          <Icon name="arrowRight" size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3.5 ${TONES[stage.tone]}`}
          >
            <span className="text-[13px] font-medium text-muted">{stage.label}</span>
            <span className="font-display text-[30px] font-extrabold leading-none">
              {stage.count}
            </span>
            <span className="text-xs text-muted">{stage.hint}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
