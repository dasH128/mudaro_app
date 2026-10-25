import Link from "next/link";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { MudaroSymbol } from "@mudaro/ui";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { LOCALES, hasLocale } from "@/app/i18n/config";
import { getDictionary, loadDictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";

export default async function AuthLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary();
  const { layout } = dict.auth;
  const options = await Promise.all(
    LOCALES.map(async (code) => ({ locale: code, name: (await loadDictionary(code)).languageName })),
  );
  const home = localePath(locale, ROUTES.home);

  return (
    <div className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca (solo escritorio) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-accent p-12 text-primary-foreground lg:flex">
        <Link
          href={home}
          className="font-display text-2xl font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          MUDARO
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em]">{layout.eyebrow}</p>
          <h2 className="mt-4 font-display text-6xl font-extrabold leading-none tracking-tight">
            {layout.headline}
          </h2>
          <ol className="mt-10 space-y-4">
            {layout.steps.map((text, i) => (
              <li key={text} className="flex items-center gap-4">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground font-display text-sm font-extrabold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-base font-medium">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <MudaroSymbol className="pointer-events-none absolute -right-16 -bottom-10 h-[26rem] w-auto opacity-95" />
      </aside>

      {/* Zona del formulario */}
      <main className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={home}
            className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:invisible"
          >
            <MudaroSymbol className="h-9 w-auto" />
            MUDARO
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle labels={layout.theme} />
            <LanguageSwitcher current={locale} label={layout.language} options={options} />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
