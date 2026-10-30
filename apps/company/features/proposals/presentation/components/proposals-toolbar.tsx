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

const tabBase =
  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const tabOn = "border-foreground bg-foreground text-background";
const tabOff = "border-status-off-border bg-surface text-foreground hover:bg-surface-soft";

export function ProposalsToolbar({ lang, t, status, q, sort, total, counts }: Props) {
  const { list } = t;
  const tabs = [
    { key: undefined, label: list.tabs.all, count: total },
    ...PROPOSAL_STATUSES.map((key) => ({ key, label: list.tabs[key], count: counts[key] })),
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3.5">
      <div role="group" aria-label={list.filterLabel} className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const selected = tab.key === status;
          return (
            <Link
              key={tab.key ?? "all"}
              href={proposalsHref(lang, { status: tab.key, q, sort })}
              aria-current={selected ? "true" : undefined}
              className={`${tabBase} ${selected ? tabOn : tabOff}`}
            >
              {tab.label}
              <span className="font-medium opacity-75">{tab.count}</span>
            </Link>
          );
        })}
      </div>

      {/* GET a la misma ruta: filtros y orden viajan en la URL */}
      <Form action={localePath(lang, ROUTES.proposals.list)} className="flex flex-wrap gap-2.5">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label className="flex h-10 w-70 max-w-full items-center gap-2.5 rounded-xl border border-field-border bg-surface px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
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
        <label className="flex h-10 items-center gap-2 rounded-xl border border-field-border bg-surface px-3 text-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
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
