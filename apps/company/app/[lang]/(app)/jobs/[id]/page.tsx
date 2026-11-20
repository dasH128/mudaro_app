import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { todayLisbon } from "@/app/lib/format";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { JobSheet } from "@/features/jobs/presentation/components/job-sheet";
import { getScheduleOverview } from "@/features/schedule/infrastructure/schedule.repo";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.jobTitle };
}

// Ficha del trabajo (paso 6.3). El id es el número del pedido (MD-0836), como en la Agenda. RLS solo devuelve los
// trabajos de la empresa, y un trabajo cancelado ya no está: los dos casos dan "no encontrado".
export default async function JobPage({ params }: PageProps<"/[lang]/jobs/[id]">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  await requireCompanySession(locale);

  const { id } = await params;
  // "Ocupado a essa hora" y el histórico ("hoje", "ontem") dependen de hoy
  await connection();
  // Lee la agenda entera: la ficha necesita los demás trabajos para avisar de quién está ocupado (decenas en el piloto)
  const overview = await getScheduleOverview();
  const job = overview.jobs.find((item) => item.id === decodeURIComponent(id));
  if (!job) notFound();

  const dict = await getDictionary();
  return (
    <JobSheet
      lang={locale}
      t={dict.app.jobs}
      schedule={dict.app.schedule}
      positions={dict.app.team.positions}
      job={job}
      overview={overview}
      today={todayLisbon()}
    />
  );
}
