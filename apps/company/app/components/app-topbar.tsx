import { AccountMenu } from "@/app/components/account-menu";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { LOCALES, type Locale } from "@/app/i18n/config";
import { getDictionary, loadDictionary } from "@/app/i18n/get-dictionary";
import { MOCK_COMPANY_NAME, MOCK_USER } from "@/app/lib/mock-session";
import { ROUTES, localePath } from "@/app/lib/routes";
import { signOutAction } from "@/features/auth/application/actions/sign-out";

/** Barra superior común a todas las pantallas autenticadas: tema, idioma y cuenta. */
export async function AppTopbar({ lang }: { lang: Locale }) {
  const dict = await getDictionary();
  const { theme, language } = dict.auth.layout;
  const { account } = dict.app;
  const { settings } = dict.app.sidebar;
  const options = await Promise.all(
    LOCALES.map(async (code) => ({ locale: code, name: (await loadDictionary(code)).languageName })),
  );

  return (
    <div className="flex flex-wrap items-center justify-end gap-3.5">
      <ThemeToggle labels={theme} />
      <LanguageSwitcher current={lang} label={language} options={options} />
      <AccountMenu
        lang={lang}
        user={MOCK_USER}
        companyName={MOCK_COMPANY_NAME}
        settingsHref={localePath(lang, ROUTES.settings)}
        labels={{ menu: account.menu, settings, signOut: account.signOut }}
        signOutAction={signOutAction}
      />
    </div>
  );
}
