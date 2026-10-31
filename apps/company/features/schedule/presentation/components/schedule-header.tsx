import type { Locale } from "@/app/i18n/config";
import { pluralize } from "@/app/i18n/interpolate";
import type { ScheduleSummary } from "../../domain/schedule";
import type { ScheduleText } from "../schedule-text";

const chip = "inline-flex h-8.5 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px]";

export function ScheduleHeader({ lang, t, summary }: { lang: Locale; t: ScheduleText; summary: ScheduleSummary }) {
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
    </header>
  );
}
