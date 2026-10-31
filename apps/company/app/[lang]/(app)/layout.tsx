import { cookies } from "next/headers";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AppSidebar } from "@/app/components/app-sidebar";
import { AppTopbar } from "@/app/components/app-topbar";
import { SIDEBAR_COOKIE, SidebarShell } from "@/app/components/sidebar-shell";
import { hasLocale, type Locale } from "@/app/i18n/config";

// La cookie del menú plegado es un dato de la petición: se lee aquí dentro, bajo <Suspense>,
// para que el resto de la ruta pueda prerenderizarse (cacheComponents).
async function Shell({ lang: locale, children }: { lang: Locale; children: ReactNode }) {
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <SidebarShell initialCollapsed={collapsed} sidebar={<AppSidebar lang={locale} />}>
      <AppTopbar lang={locale} />
      {children}
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
