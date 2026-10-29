import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { AppSidebar } from "@/app/components/app-sidebar";
import { hasLocale } from "@/app/i18n/config";

export default async function AppLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  return (
    <div className="grid flex-1 lg:grid-cols-[248px_minmax(0,1fr)]">
      <AppSidebar lang={locale} />
      <main className="flex min-w-0 flex-col gap-6 px-4 py-7 sm:px-8 lg:px-10 lg:pb-10">
        {children}
      </main>
    </div>
  );
}
