"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Icon } from "@/app/components/app-icon";
import { useDismiss } from "@/app/components/use-dismiss";
import type { Locale } from "@/app/i18n/config";

type AccountMenuProps = {
  lang: Locale;
  user: { name: string; initials: string };
  companyName: string;
  settingsHref: string;
  labels: { menu: string; settings: string; signOut: string };
  /** Server Action que cierra la sesión (recibe `lang` en el FormData). */
  signOutAction: (formData: FormData) => Promise<void>;
};

/** Avatar con desplegable: ajustes y cerrar sesión. */
export function AccountMenu({ lang, user, companyName, settingsHref, labels, signOutAction }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(open, root, () => setOpen(false));

  const item =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={labels.menu}
        className="flex h-11 items-center gap-2 rounded-xl pr-2 pl-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="grid size-10 place-items-center rounded-full bg-foreground text-sm font-bold text-background">
          {user.initials}
        </span>
        <Icon name="chevronDown" size={16} />
      </button>

      {open && (
        <div
          role="group"
          aria-label={labels.menu}
          className="absolute right-0 z-20 mt-2 min-w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
        >
          <div className="flex flex-col px-3 py-2">
            <span className="text-sm font-bold">{user.name}</span>
            <span className="text-[13px] text-muted">{companyName}</span>
          </div>
          <div className="my-1 border-t border-line" />
          <Link href={settingsHref} onClick={() => setOpen(false)} className={item}>
            <Icon name="settings" size={18} />
            {labels.settings}
          </Link>
          <form action={signOutAction}>
            <input type="hidden" name="lang" value={lang} />
            <button type="submit" className={item}>
              <Icon name="lock" size={18} />
              {labels.signOut}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
