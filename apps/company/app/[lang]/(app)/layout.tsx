import { cookies } from "next/headers";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { AppSidebar } from "@/app/components/app-sidebar";
import { AppTopbar } from "@/app/components/app-topbar";
import { SIDEBAR_COOKIE, SidebarShell } from "@/app/components/sidebar-shell";
import { hasLocale } from "@/app/i18n/config";

export default async function AppLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <SidebarShell initialCollapsed={collapsed} sidebar={<AppSidebar lang={locale} />}>
      <AppTopbar lang={locale} />
      {children}
    </SidebarShell>
  );
}
