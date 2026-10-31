import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { formatDateRange, formatDayWithYear, formatMonthWithYear, formatTime, todayLisbon } from "@/app/lib/format";
import {
  DEFAULT_VIEW,
  addDays,
  addMonths,
  filterJobs,
  isIsoDate,
  isView,
  monthOf,
  parseShow,
  scheduleAlerts,
  startOfWeek,
  summarize,
  toHours,
} from "@/features/schedule/domain/schedule";
import { getScheduleOverview } from "@/features/schedule/infrastructure/schedule.repo";
import { DayView } from "@/features/schedule/presentation/components/day-view";
import { JobPanel } from "@/features/schedule/presentation/components/job-panel";
import { MonthView } from "@/features/schedule/presentation/components/month-view";
import { ScheduleAlertsSection } from "@/features/schedule/presentation/components/schedule-alerts";
import { ScheduleHeader } from "@/features/schedule/presentation/components/schedule-header";
import { ScheduleToolbar } from "@/features/schedule/presentation/components/schedule-toolbar";
import { WeekView } from "@/features/schedule/presentation/components/week-view";
import { scheduleHref } from "@/features/schedule/presentation/schedule-href";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.scheduleTitle };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. Cuando exista, la página comprueba sesión y rol en servidor.
export default async function SchedulePage({ searchParams }: PageProps<"/[lang]/schedule">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary();
  const t = dict.app.schedule;

  const params = await searchParams;
  const viewParam = first(params.view);
  const view = isView(viewParam) ? viewParam : DEFAULT_VIEW;
  const show = parseShow(first(params.show));

  // "Hoy", la línea de la hora actual y los trabajos relativos a hoy se calculan en cada petición
  await connection();
  const now = new Date();
  const today = todayLisbon(now);
  const dateParam = first(params.date);
  const date = isIsoDate(dateParam) ? dateParam : today;
  const overview = await getScheduleOverview({ today });

  const jobs = filterJobs(overview.jobs, show);
  const weekStart = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  // Hora actual de Lisboa, solo si cae dentro del horario que dibuja la agenda
  const hourNow = toHours(formatTime(now.toISOString()));
  const nowHour = hourNow >= 7 && hourNow < 19 ? hourNow : null;

  // Etiqueta del rango y saltos de "anterior" y "siguiente" según la vista
  const rangeLabel =
    view === "month" ? formatMonthWithYear(locale, date) : view === "week" ? formatDateRange(locale, days[0] ?? date, days[6] ?? date) : formatDayWithYear(locale, date);
  const step = view === "month" ? (d: number) => addMonths(date, d) : view === "week" ? (d: number) => addDays(date, 7 * d) : (d: number) => addDays(date, d);

  // El día elegido del mes: el de la URL si es de ese mes; si no, hoy o el día 1
  const dayParam = first(params.day);
  const selectedDay = isIsoDate(dayParam) ? dayParam : monthOf(today) === monthOf(date) ? today : `${monthOf(date)}-01`;

  // Solo los trabajos con ficha completa abren el panel
  const requested = first(params.job);
  const opened = overview.jobs.find((job) => job.id === requested && job.detail !== undefined);

  return (
    <>
      <ScheduleHeader lang={locale} t={t} summary={summarize(overview.jobs, weekStart)} />
      <ScheduleAlertsSection lang={locale} t={t} alerts={scheduleAlerts(overview, today)} today={today} />
      <ScheduleToolbar
        lang={locale}
        t={t}
        view={view}
        date={date}
        show={show}
        job={opened?.id}
        rangeLabel={rangeLabel}
        previousDate={step(-1)}
        nextDate={step(1)}
        vehicles={overview.vehicles}
        people={overview.people}
      />

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3">
          {view === "week" ? (
            <WeekView
              lang={locale}
              t={t}
              days={days}
              jobs={jobs}
              vehicles={overview.vehicles}
              people={overview.people}
              today={today}
              nowHour={nowHour}
              show={show}
              selectedJobId={opened?.id}
            />
          ) : view === "day" ? (
            <DayView
              lang={locale}
              t={t}
              positions={dict.app.team.positions}
              day={date}
              jobs={jobs}
              vehicles={overview.vehicles}
              people={overview.people}
              show={show}
              selectedJobId={opened?.id}
            />
          ) : (
            <MonthView
              lang={locale}
              t={t}
              overview={overview}
              jobs={jobs}
              date={date}
              today={today}
              selected={selectedDay}
              show={show}
              monthLabel={rangeLabel}
            />
          )}
        </div>

        {opened ? (
          <JobPanel
            key={opened.id}
            lang={locale}
            t={t}
            positions={dict.app.team.positions}
            job={opened}
            overview={overview}
            today={today}
            closeHref={scheduleHref(locale, { view, date, show, day: view === "month" ? selectedDay : undefined })}
          />
        ) : null}
      </div>
    </>
  );
}
