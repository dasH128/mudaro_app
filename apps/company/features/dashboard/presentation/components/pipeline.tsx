import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { pluralize } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { Stage } from "@/features/dashboard/domain/types";
import type { HomeText } from "../home-text";

const TONES: Record<Stage["tone"], string> = {
  neutral: "border-line-soft bg-surface-soft",
  warn: "border-warn-border bg-warn-surface",
  success: "border-success-border bg-success-surface",
};

export function Pipeline({ lang, t, stages }: { lang: Locale; t: HomeText; stages: readonly Stage[] }) {
  const p = t.pipeline;
  // El subtítulo avisa de cuántos inventarios esperan presupuesto
  const waiting = stages.find((stage) => stage.key === "inventory-received")?.count ?? 0;

  return (
    <section
      aria-labelledby="pipeline"
      className="flex flex-col gap-[18px] rounded-3xl border border-line bg-surface p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1">
          <h2 id="pipeline" className="font-display text-[22px] font-extrabold">
            {p.title}
          </h2>
          <p className="text-sm text-muted">{pluralize(lang, waiting, p.subtitle)}</p>
        </div>
        <Link
          href={localePath(lang, ROUTES.orders.list)}
          className="text-[13px] font-bold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {p.viewOrders}
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className={`flex flex-col gap-1.5 rounded-[14px] border px-4 py-3.5 ${TONES[stage.tone]}`}
          >
            <span className="text-[13px] font-medium text-muted">{p.stages[stage.key].label}</span>
            <span className="font-display text-[30px] font-extrabold leading-none">{stage.count}</span>
            <span className="text-xs text-muted">{p.stages[stage.key].hint}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
