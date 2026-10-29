import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { ProposalsText } from "../proposals-text";

export function ProposalsHeader({ lang, t }: { lang: Locale; t: ProposalsText }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">
          {t.title}
        </h1>
        <p className="text-base text-muted">{t.subtitle}</p>
      </div>
      <Link
        href={localePath(lang, ROUTES.proposals.new)}
        className="flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-5.5 text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <Icon name="plus" size={18} strokeWidth={2.5} />
        {t.new}
      </Link>
    </header>
  );
}
