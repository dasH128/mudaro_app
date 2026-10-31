import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { Attention } from "@/features/dashboard/domain/types";
import type { HomeText } from "../home-text";

export function AttentionBanner({ lang, t, attention }: { lang: Locale; t: HomeText; attention: Attention }) {
  const a = t.attention;

  return (
    <section
      aria-labelledby="attention"
      className="flex gap-3.5 rounded-[20px] border border-warn-border bg-warn-surface px-4.5 py-4"
    >
      <span aria-hidden className="grid size-10 flex-none place-items-center rounded-xl bg-warn-border/30 text-warn-foreground">
        <Icon name="alert" size={20} />
      </span>
      <div className="flex flex-col gap-1 text-sm leading-snug text-warn-foreground">
        <h2 id="attention" className="font-bold">
          {a.title}
        </h2>
        <p>{interpolate(a.text, { incident: attention.incident, job: attention.jobId, reason: attention.reason })}</p>
        <Link
          href={localePath(lang, ROUTES.incidents.detail(attention.incident.replace("#", "")))}
          className="text-[13px] font-bold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {a.action}
        </Link>
      </div>
    </section>
  );
}
