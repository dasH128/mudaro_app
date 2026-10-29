import Link from "next/link";

import { MudaroSymbol } from "@mudaro/ui";
import { AppNav } from "@/app/components/app-nav";
import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { interpolate } from "@/app/i18n/interpolate";
import { MOCK_COMPANY_NAME, MOCK_USER } from "@/app/lib/mock-session";
import { ROUTES, localePath } from "@/app/lib/routes";

const itemBase =
  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const itemIdle = "text-on-ink hover:bg-white/[0.08] hover:text-white";

export async function AppSidebar({ lang }: { lang: Locale }) {
  const { sidebar } = (await getDictionary()).app;

  return (
    <aside className="flex flex-col gap-4 bg-sidebar px-4 py-4 text-on-ink lg:sticky lg:top-0 lg:h-screen lg:gap-7 lg:px-4.5 lg:pt-7 lg:pb-6">
      <Link
        href={localePath(lang, ROUTES.home)}
        className="flex items-center gap-2.5 px-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <MudaroSymbol variant="light" className="h-10.25 w-auto" />
        <span className="font-display text-[26px] font-extrabold tracking-tight text-white">
          MUDARO
        </span>
      </Link>

      <div className="mx-1 hidden flex-col gap-0.5 rounded-xl border border-white/15 px-3.5 py-3 lg:flex">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          {sidebar.company}
        </span>
        <span className="text-[15px] font-bold text-white">{MOCK_COMPANY_NAME}</span>
      </div>

      <AppNav lang={lang} label={sidebar.mainMenu} labels={sidebar.nav} />

      <div className="mt-auto hidden flex-col gap-4 lg:flex">
        <Link href={localePath(lang, ROUTES.settings)} className={`${itemBase} ${itemIdle}`}>
          <Icon name="settings" />
          {sidebar.settings}
        </Link>
        <div className="flex items-center gap-3 border-t border-white/15 px-3 pt-3.5">
          <span className="grid size-10 place-items-center rounded-full bg-on-ink text-sm font-bold text-primary-foreground">
            {MOCK_USER.initials}
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-bold text-white">
              {interpolate(sidebar.greeting, { name: MOCK_USER.name })}
            </span>
            <span className="text-[13px] text-on-ink">{sidebar.role}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
