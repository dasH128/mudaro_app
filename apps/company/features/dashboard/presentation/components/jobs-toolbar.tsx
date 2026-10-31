import Form from "next/form";
import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { DEFAULT_JOB_FILTER, JOB_FILTERS, type JobFilter } from "../../domain/jobs";
import { jobsHref } from "../jobs-href";
import type { HomeText } from "../home-text";

type Props = { lang: Locale; t: HomeText; filter: JobFilter; q: string; counts: Record<JobFilter, number> };

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const chip = `inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold ${focusRing}`;
const field =
  "flex h-10 w-44 items-center gap-2 rounded-full border border-status-off-border px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary";

/** Filtros por estado y búsqueda de "Trabalhos de hoje", con el mismo aspecto que las listas. Viajan en la URL. */
export function JobsToolbar({ lang, t, filter, q, counts }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-full border border-line bg-surface p-2">
      <div role="group" aria-label={t.filters.label} className="inline-flex flex-wrap gap-1">
        {JOB_FILTERS.map((key) => {
          const selected = key === filter;
          return (
            <Link
              key={key}
              href={jobsHref(lang, { filter: key, q })}
              scroll={false}
              aria-current={selected ? "true" : undefined}
              className={`${chip} ${selected ? "border-foreground bg-foreground text-background" : "border-transparent text-foreground hover:bg-surface-soft"}`}
            >
              {t.filters[key]} <span className="opacity-70">{counts[key]}</span>
            </Link>
          );
        })}
      </div>

      {/* GET a la misma ruta: la búsqueda conserva el filtro */}
      <Form action={localePath(lang, ROUTES.home)} scroll={false}>
        {filter !== DEFAULT_JOB_FILTER ? <input type="hidden" name="status" value={filter} /> : null}
        <label className={field}>
          <Icon name="search" size={16} className="text-muted" />
          <span className="sr-only">{t.filters.searchLabel}</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t.filters.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-field-placeholder"
          />
        </label>
      </Form>
    </div>
  );
}
