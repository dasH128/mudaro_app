import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { interpolate } from "@/app/i18n/interpolate";
import { formatCubicMeters, formatDayMonth, formatPhone, formatWeekdayShort } from "@/app/lib/format";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { HANDOVER_MOMENTS, type HandoverMoment } from "@/features/jobs/domain/execution";
import { PrintButton } from "@/features/jobs/presentation/components/print-button";
import { vehicleOf } from "@/features/schedule/domain/schedule";
import { getScheduleOverview } from "@/features/schedule/infrastructure/schedule.repo";
import { describeAccess } from "@/features/schedule/presentation/schedule-text";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.jobPrintTitle };
}

const isMoment = (value: string): value is HandoverMoment => HANDOVER_MOMENTS.some((m) => m === value);

const box = "rounded-lg border border-foreground/40 p-3";
const lineLabel = "text-[11px] font-bold uppercase tracking-[0.08em] text-muted";

/**
 * Acta imprimible de recogida o entrega (paso 6.5, P13). Fuera del menú lateral para que la hoja salga limpia. El
 * conductor la lleva, el cliente la firma y el administrador sube la foto en la ficha del trabajo. Sin precios.
 */
export default async function JobPrintPage({ params }: PageProps<"/[lang]/print/jobs/[id]/[moment]">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  const session = await requireCompanySession(locale);
  const { id, moment } = await params;
  if (!isMoment(moment)) notFound();

  await connection();
  const overview = await getScheduleOverview();
  const job = overview.jobs.find((item) => item.id === decodeURIComponent(id));
  if (!job) notFound();

  const dict = await getDictionary();
  const t = dict.app.jobs.print;
  const schedule = dict.app.schedule;
  const vehicle = vehicleOf(job, overview.vehicles);
  const crew = job.crewIds.flatMap((personId) => overview.people.find((person) => person.id === personId) ?? []);
  const lead = overview.people.find((person) => person.id === job.detail?.leadId);
  const isPickup = moment === "pickup";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 bg-background p-6 text-foreground print:max-w-none print:p-0 print:text-[12px]">
      <div className="flex justify-end print:hidden">
        <PrintButton label={t.print} />
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-foreground pb-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold">{session.companyName}</span>
          <h1 className="font-display text-3xl font-extrabold">{isPickup ? t.pickupTitle : t.deliveryTitle}</h1>
        </div>
        <div className="flex flex-col items-end text-sm">
          <strong className="font-mono">{job.id}</strong>
          <span>
            {formatWeekdayShort(locale, job.date)} {formatDayMonth(job.date)} · {job.start}–{job.end}
          </span>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
        <div className={box}>
          <span className={lineLabel}>{t.client}</span>
          <p className="font-bold">{job.client}</p>
          {job.detail ? <p>{formatPhone(job.detail.clientPhone)}</p> : null}
        </div>
        <div className={box}>
          <span className={lineLabel}>{t.crew}</span>
          <p>{interpolate(t.vehicle, { vehicle: vehicle?.name ?? t.none })}</p>
          <p>{crew.length === 0 ? t.none : crew.map((person) => (person.id === lead?.id ? interpolate(t.lead, { name: person.name }) : person.name)).join(", ")}</p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        {(job.detail?.addresses ?? []).map((address) => (
          <div key={address.kind} className={box}>
            <span className={lineLabel}>{address.kind === "origin" ? t.origin : t.destination}</span>
            <p className="font-bold">{address.place}</p>
            <p className="text-sm">{describeAccess(address.access, schedule)}</p>
          </div>
        ))}
        <p className="text-sm">{interpolate(t.volume, { volume: formatCubicMeters(job.volumeM3) })}</p>
      </section>

      <section className="flex flex-col gap-2">
        <span className={lineLabel}>{t.remarks}</span>
        <div className="flex flex-col gap-6 pt-3">
          {[0, 1, 2, 3].map((line) => (
            <span key={line} className="block border-b border-foreground/40" />
          ))}
        </div>
      </section>

      <p className="text-sm">{isPickup ? t.pickupStatement : t.deliveryStatement}</p>

      <section className="grid grid-cols-2 gap-4 pt-2">
        {[t.clientSignature, t.crewSignature].map((title) => (
          <div key={title} className="flex flex-col gap-2">
            <span className={lineLabel}>{title}</span>
            <div className="h-24 rounded-lg border border-foreground/40" />
            <span className="text-xs text-muted">{t.nameAndDate}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
