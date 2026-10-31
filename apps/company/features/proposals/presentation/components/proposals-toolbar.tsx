import Form from "next/form";
import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { SORTS, type ProposalSort } from "@/features/proposals/domain/filters";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/features/proposals/domain/types";
import { proposalsHref } from "../proposals-href";
import type { ProposalsText } from "../proposals-text";
import { SortSelect } from "@/app/components/form/sort-select";

type Props = {
  lang: Locale;
  t: ProposalsText;
  status: ProposalStatus | undefined;
  q: string;
  sort: ProposalSort;
  total: number;
  counts: Record<ProposalStatus, number>;
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const chip = `inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold ${focusRing}`;
const field =
  "flex h-10 items-center rounded-full border border-status-off-border px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary";

export function ProposalsToolbar({ lang, t, status, q, sort, total, counts }: Props) {
  const { list } = t;
  const tabs = [
    { key: undefined, label: list.tabs.all, count: total },
    ...PROPOSAL_STATUSES.map((key) => ({ key, label: list.tabs[key], count: counts[key] })),
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-full border border-line bg-surface p-2">
      <div role="group" aria-label={list.filterLabel} className="inline-flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const selected = tab.key === status;
          return (
            <Link
              key={tab.key ?? "all"}
              href={proposalsHref(lang, { status: tab.key, q, sort })}
              aria-current={selected ? "true" : undefined}
              className={`${chip} ${selected ? "border-foreground bg-foreground text-background" : "border-transparent text-foreground hover:bg-surface-soft"}`}
            >
              {tab.label} <span className="opacity-70">{tab.count}</span>
            </Link>
          );
        })}
      </div>

      {/* GET a la misma ruta: filtros y orden viajan en la URL */}
      <Form action={localePath(lang, ROUTES.proposals.list)} className="flex flex-wrap items-center gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label className={`${field} w-52.5 gap-2`}>
          <Icon name="search" size={16} className="text-muted" />
          <span className="sr-only">{list.searchLabel}</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={list.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-field-placeholder"
          />
        </label>
        <label className={`${field} gap-1.5 text-[13px]`}>
          <span className="text-muted">{list.sortLabel}</span>
          <SortSelect
            name="sort"
            value={sort}
            options={SORTS.map((value) => ({ value, label: list.sort[value] }))}
          />
        </label>
      </Form>
    </div>
  );
}
