"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LOCALE_COOKIE, type Locale } from "@/app/i18n/config";

type LanguageSwitcherProps = {
  current: Locale;
  label: string;
  /** Nombre nativo de cada idioma, tomado de su propio JSON (languageName). */
  options: { locale: Locale; name: string }[];
};

export function LanguageSwitcher({ current, label, options }: LanguageSwitcherProps) {
  const pathname = usePathname();
  // /es/login -> /login
  const rest = pathname.replace(/^\/[^/]+/, "") || "";

  return (
    <nav aria-label={label} className="flex items-center gap-1 text-sm">
      {options.map(({ locale, name }) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={`/${locale}${rest}`}
            hrefLang={locale}
            lang={locale}
            aria-current={active ? "true" : undefined}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
            }}
            className={`rounded-lg px-3 py-1.5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5"
            }`}
          >
            {name}
          </Link>
        );
      })}
    </nav>
  );
}
