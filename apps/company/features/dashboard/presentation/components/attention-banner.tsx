import Link from "next/link";

import { Icon } from "@/app/components/icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";

export function AttentionBanner({ lang }: { lang: Locale }) {
  return (
    <section
      aria-labelledby="attention"
      className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border border-warn-border bg-warn-surface px-6 py-5"
    >
      <span className="grid size-11 flex-none place-items-center rounded-full bg-primary text-primary-foreground">
        <Icon name="alert" size={22} strokeWidth={2.2} />
      </span>
      <div className="flex min-w-65 flex-1 flex-col gap-1">
        <h2 id="attention" className="font-display text-xl font-extrabold text-warn-foreground">
          Requer a tua atenção
        </h2>
        <p className="text-[15px] text-warn-foreground">
          Incidência #IC-004 no trabalho MD-0821: carga com medidas incorretas.
        </p>
      </div>
      <Link
        href={localePath(lang, ROUTES.incidents.detail("IC-004"))}
        className="flex h-11 items-center gap-2 rounded-xl border border-field-border bg-white px-4.5 text-sm font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Rever incidência
        <Icon name="arrowRight" size={16} />
      </Link>
    </section>
  );
}
