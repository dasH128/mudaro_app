import Form from "next/form";
import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { VIEWS, showToParam, type Show, type ScheduleView } from "../../domain/schedule";
import type { Person, Vehicle } from "../../domain/types";
import { scheduleHref } from "../schedule-href";
import type { ScheduleText } from "../schedule-text";
import { focusRing } from "./schedule-parts";
import { ShowSelect } from "./show-select";

type Props = {
  lang: Locale;
  t: ScheduleText;
  view: ScheduleView;
  date: string;
  show: Show;
  job: string | undefined;
  /** "26 out – 1 nov 2026", "Novembro 2026"… según la vista. */
  rangeLabel: string;
  previousDate: string;
  nextDate: string;
  vehicles: readonly Vehicle[];
  people: readonly Person[];
};

const roundButton = `grid size-9.5 place-items-center rounded-full border border-status-off-border bg-surface text-foreground ${focusRing}`;
const field =
  "flex h-10 items-center gap-1.5 rounded-full border border-status-off-border px-3 text-[13px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary";

/** Hoy, anterior y siguiente, qué mostrar y vista. Todo viaja en la URL (enlaces y un formulario GET). */
export function ScheduleToolbar({ lang, t, view, date, show, job, rangeLabel, previousDate, nextDate, vehicles, people }: Props) {
  const tb = t.toolbar;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-full border border-line bg-surface p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={scheduleHref(lang, { view, show, job })}
          scroll={false}
          className={`inline-flex h-9.5 items-center rounded-full border border-field-border bg-surface px-4 text-sm font-bold text-foreground ${focusRing}`}
        >
          {tb.today}
        </Link>
        <span className="inline-flex gap-1">
          <Link href={scheduleHref(lang, { view, date: previousDate, show, job })} scroll={false} aria-label={tb.previous} className={roundButton}>
            <Icon name="chevronLeft" size={16} strokeWidth={2.4} />
          </Link>
          <Link href={scheduleHref(lang, { view, date: nextDate, show, job })} scroll={false} aria-label={tb.next} className={roundButton}>
            <Icon name="chevronRight" size={16} strokeWidth={2.4} />
          </Link>
        </span>
        <strong className="px-1.5 font-display text-xl">{rangeLabel}</strong>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* GET a la misma ruta: conserva la vista, la fecha y el trabajo abierto */}
        <Form action={localePath(lang, ROUTES.schedule)} scroll={false}>
          {view !== "week" ? <input type="hidden" name="view" value={view} /> : null}
          <input type="hidden" name="date" value={date} />
          {job ? <input type="hidden" name="job" value={job} /> : null}
          <label className={field}>
            <span className="text-muted">{tb.show}</span>
            <ShowSelect
              name="show"
              value={showToParam(show) ?? "all"}
              options={[
                { value: "all", label: tb.showAll },
                { value: "unassigned", label: tb.showUnassigned },
              ]}
              groups={[
                { label: tb.showVehicles, options: vehicles.map((v) => ({ value: `vehicle:${v.id}`, label: v.name })) },
                { label: tb.showPeople, options: people.map((p) => ({ value: `person:${p.id}`, label: p.name })) },
              ]}
            />
          </label>
        </Form>

        <div role="group" aria-label={tb.view.label} className="inline-flex gap-1 rounded-full bg-surface-head p-1">
          {VIEWS.map((key) => {
            const selected = key === view;
            return (
              <Link
                key={key}
                href={scheduleHref(lang, { view: key, date, show, job })}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={`inline-flex h-8.5 items-center rounded-full px-4 text-[13px] font-bold ${focusRing} ${selected ? "bg-foreground text-background" : "text-foreground"}`}
              >
                {tb.view[key]}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
