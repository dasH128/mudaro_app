import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";

import { getDashboard } from "@/features/dashboard/infrastructure/dashboard.repo";
import { AttentionBanner } from "@/features/dashboard/presentation/components/attention-banner";
import { DashboardHeader } from "@/features/dashboard/presentation/components/dashboard-header";
import { JobsTable } from "@/features/dashboard/presentation/components/jobs-table";
import { Pipeline } from "@/features/dashboard/presentation/components/pipeline";
import { FleetSummary, RecentActivity, Shortcuts } from "@/features/dashboard/presentation/components/side-panels";
import { StatCards } from "@/features/dashboard/presentation/components/stat-cards";

export const metadata: Metadata = { title: "Operações de hoje · Mudaro" };

export default async function DashboardPage() {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  // La cabecera muestra la fecha de hoy: se calcula en cada petición, nunca en el prerender
  await connection();
  const dashboard = await getDashboard();

  return (
    <>
      <DashboardHeader lang={locale} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <StatCards stats={dashboard.stats} />
          <AttentionBanner lang={locale} />
          <JobsTable lang={locale} jobs={dashboard.jobs} />
          <Pipeline lang={locale} stages={dashboard.stages} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <FleetSummary lang={locale} />
          <RecentActivity lang={locale} activity={dashboard.activity} />
          <Shortcuts lang={locale} />
        </div>
      </div>
    </>
  );
}
