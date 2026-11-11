import { cookies } from "next/headers";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AppSidebar } from "@/app/components/app-sidebar";
import { AppTopbar } from "@/app/components/app-topbar";
import { ErrorTextProvider } from "@/app/components/error-text-provider";
import { SIDEBAR_COOKIE, SidebarShell } from "@/app/components/sidebar-shell";
import { hasLocale, type Locale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { requireCompanySession } from "@/features/auth/application/require-session";

// La cookie del menú plegado es un dato de la petición: se lee aquí dentro, bajo <Suspense>,
// para que el resto de la ruta pueda prerenderizarse (cacheComponents).
async function Shell({ lang: locale, children }: { lang: Locale; children: ReactNode }) {
  const session = await requireCompanySession(locale);
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";
  const errorText = (await getDictionary()).app.errors.unexpected;

  return (
    <SidebarShell initialCollapsed={collapsed} sidebar={<AppSidebar lang={locale} session={session} />}>
      <AppTopbar lang={locale} session={session} />
      {/* Textos para (app)/error.tsx, que es de cliente y queda dentro de este layout */}
      <ErrorTextProvider value={errorText}>{children}</ErrorTextProvider>
    </SidebarShell>
  );
}

export default async function AppLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  return (
    <Suspense fallback={null}>
      <Shell lang={locale}>{children}</Shell>
    </Suspense>
  );
}
