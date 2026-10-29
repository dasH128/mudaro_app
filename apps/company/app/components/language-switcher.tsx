"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { Icon } from "@/app/components/app-icon";
import { useDismiss } from "@/app/components/use-dismiss";
import { LOCALE_COOKIE, type Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";

type LanguageSwitcherProps = {
  current: Locale;
  label: string;
  /** Nombre nativo de cada idioma, tomado de su propio JSON (languageName). */
  options: { locale: Locale; name: string }[];
};

/** Botón con el idioma actual que abre una lista para elegir otro. */
export function LanguageSwitcher({ current, label, options }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // /es/login -> /login
  const rest = pathname.replace(/^\/[^/]+/, "") || "";
  const currentName = options.find((o) => o.locale === current)?.name ?? current;

  useDismiss(open, root, () => setOpen(false));

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${label}: ${currentName}`}
        className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon name="globe" size={18} />
        <span className="uppercase">{current}</span>
        <Icon name="chevronDown" size={16} />
      </button>

      {open && (
        <ul
          aria-label={label}
          className="absolute right-0 z-20 mt-2 min-w-40 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
        >
          {options.map(({ locale, name }) => {
            const active = locale === current;
            return (
              <li key={locale}>
                <Link
                  href={localePath(locale, rest || ROUTES.home)}
                  hrefLang={locale}
                  lang={locale}
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    active ? "bg-foreground/5 font-bold" : "font-medium hover:bg-foreground/5"
                  }`}
                >
                  {name}
                  {active && <Icon name="check" size={16} />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
