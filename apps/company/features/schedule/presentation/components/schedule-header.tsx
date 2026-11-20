import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { pluralize } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { ScheduleSummary } from "../../domain/schedule";
import type { ScheduleText } from "../schedule-text";

const chip = "inline-flex h-8.5 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px]";

type Props = {
  lang: Locale;
  t: ScheduleText;
  summary: ScheduleSummary;
  /** Rango propuesto para exportar (dd/mm/aaaa): del día 1 del mes a hoy. */
  exportRange: { from: string; to: string };
  /** La última exportación volvió con fechas mal escritas. */
  exportError: boolean;
};

const field = "h-10 rounded-xl border border-field-border bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function ScheduleHeader({ lang, t, summary, exportRange, exportError }: Props) {
  const s = t.stats;

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{t.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8.5 items-center gap-2 rounded-full bg-foreground px-3.5 text-sm text-background">
            <strong className="font-display text-[17px]">{summary.week}</strong> {pluralize(lang, summary.week, s.week)}
          </span>
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            <strong>{summary.inProgress}</strong> {s.inProgress}
          </span>
          <span className={chip}>
            <span aria-hidden className="box-border size-2 rounded-full border-2 border-dashed border-primary" />
            <strong>{summary.unassigned}</strong> {s.unassigned}
          </span>
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-success-dot" />
            <strong>{summary.toClose}</strong> {pluralize(lang, summary.toClose, s.toClose)}
          </span>
        </div>
      </div>

      {/* Exportar para facturar (RF-60): formulario GET hacia la ruta del CSV, sin JavaScript */}
      <details open={exportError} className="group relative">
        <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-field-border bg-surface px-4.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          <Icon name="filePlus" size={16} strokeWidth={2.2} />
          {t.export.title}
        </summary>
        <form
          method="get"
          action={localePath(lang, ROUTES.jobs.export)}
          className="absolute right-0 z-10 mt-2 flex w-80 flex-col gap-3 rounded-[20px] border border-line bg-surface p-4 shadow-[0_16px_40px_rgba(27,31,59,0.12)]"
        >
          <p className="text-[13px] text-muted">{t.export.text}</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-[13px] font-bold">
              {t.export.from}
              <input name="from" defaultValue={exportRange.from} placeholder="dd/mm/aaaa" inputMode="numeric" autoComplete="off" className={field} />
            </label>
            <label className="flex flex-col gap-1 text-[13px] font-bold">
              {t.export.to}
              <input name="to" defaultValue={exportRange.to} placeholder="dd/mm/aaaa" inputMode="numeric" autoComplete="off" className={field} />
            </label>
          </div>
          {exportError ? (
            <p role="alert" className="text-[13px] font-bold text-danger-foreground">
              {t.export.error}
            </p>
          ) : null}
          <button
            type="submit"
            className="inline-flex h-10 w-fit cursor-pointer items-center rounded-full bg-foreground px-4.5 text-sm font-bold text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t.export.download}
          </button>
        </form>
      </details>
    </header>
  );
}
