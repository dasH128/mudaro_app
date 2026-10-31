import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { DEFAULT_JOB_FILTER, countJobsByFilter, filterJobs, isJobFilter } from "@/features/dashboard/domain/jobs";

import { getDashboard } from "@/features/dashboard/infrastructure/dashboard.repo";
import { AttentionBanner } from "@/features/dashboard/presentation/components/attention-banner";
import { DashboardHeader } from "@/features/dashboard/presentation/components/dashboard-header";
import { JobsTable } from "@/features/dashboard/presentation/components/jobs-table";
import { JobsToolbar } from "@/features/dashboard/presentation/components/jobs-toolbar";
import { Pipeline } from "@/features/dashboard/presentation/components/pipeline";
import { FleetSummary, RecentActivity, Shortcuts } from "@/features/dashboard/presentation/components/side-panels";
import { StatCards } from "@/features/dashboard/presentation/components/stat-cards";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.homeTitle };
}

export default async function DashboardPage({ searchParams }: PageProps<"/[lang]">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const t = (await getDictionary()).app.home;
  const params = await searchParams;
  const statusParam = Array.isArray(params.status) ? params.status[0] : params.status;
  const filter = isJobFilter(statusParam) ? statusParam : DEFAULT_JOB_FILTER;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";

  // La cabecera muestra la fecha de hoy: se calcula en cada petición, nunca en el prerender
  await connection();
  const today = new Date();
  const dashboard = await getDashboard();

  return (
    <>
      <DashboardHeader lang={locale} t={t} today={today} unreadNotifications={2} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <StatCards t={t} stats={dashboard.stats} />
          {dashboard.attention ? <AttentionBanner lang={locale} t={t} attention={dashboard.attention} /> : null}
          <JobsToolbar lang={locale} t={t} filter={filter} q={q} counts={countJobsByFilter(dashboard.jobs)} />
          <JobsTable lang={locale} t={t} jobs={filterJobs(dashboard.jobs, filter, q)} />
          <Pipeline lang={locale} t={t} stages={dashboard.stages} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <FleetSummary lang={locale} t={t} />
          <RecentActivity lang={locale} t={t} activity={dashboard.activity} />
          <Shortcuts lang={locale} t={t} />
        </div>
      </div>
    </>
  );
}
