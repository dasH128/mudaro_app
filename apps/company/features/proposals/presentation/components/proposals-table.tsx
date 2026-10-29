import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatEuro, formatPercent, formatVolume } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import { deriveValidity } from "@/features/proposals/domain/status";
import type { Proposal } from "@/features/proposals/domain/types";
import { describeValidity, type ProposalsText } from "../proposals-text";
import { StatusPill } from "./status-pill";

type Props = {
  lang: Locale;
  t: ProposalsText;
  rows: readonly Proposal[];
  /** Total de propuestas sin filtrar, para "A mostrar N de M". */
  total: number;
  today: string;
  /** Solo administradores (RNF-03). */
  showMargin: boolean;
};

const th = "px-3.5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted";
const td = "px-3.5 py-4";

export function ProposalsTable({ lang, t, rows, total, today, showMargin }: Props) {
  const { columns, list } = t;
  const columnCount = showMargin ? 8 : 7;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-245 border-collapse text-sm">
          <thead>
            <tr className="bg-surface-head text-left">
              <th scope="col" className={`${th} rounded-l-[10px]`}>{columns.proposal}</th>
              <th scope="col" className={th}>{columns.clientRoute}</th>
              <th scope="col" className={th}>{columns.volume}</th>
              <th scope="col" className={`${th} text-right`}>{columns.total}</th>
              {showMargin ? <th scope="col" className={`${th} text-right`}>{columns.margin}</th> : null}
              <th scope="col" className={th}>{columns.validity}</th>
              <th scope="col" className={th}>{columns.status}</th>
              <th scope="col" className="rounded-r-[10px] px-3.5 py-3">
                <span className="sr-only">{columns.open}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-3.5 py-10 text-center text-muted">
                  {list.empty}
                </td>
              </tr>
            ) : null}
            {rows.map((proposal) => {
              const validity = describeValidity(deriveValidity(proposal, today), t, lang, today);
              return (
                // Todas las versiones de una propuesta comparten número (RF-42)
                <tr key={`${proposal.id}-v${proposal.version}`} className="border-b border-line-soft hover:bg-surface-soft">
                  <td className={`${td} whitespace-nowrap`}>
                    <div className="font-bold">{proposal.id}</div>
                    <div className="text-[13px] text-muted">
                      v{proposal.version} · {proposal.requestId}
                    </div>
                  </td>
                  <td className={td}>
                    <div className="font-bold">{proposal.client}</div>
                    <div className="text-[13px] text-muted">
                      {proposal.from} <span aria-hidden="true">→</span>
                      <span className="sr-only">{list.routeTo}</span> {proposal.to}
                    </div>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{formatVolume(proposal.volumeM3)}</td>
                  <td className={`${td} whitespace-nowrap text-right font-bold`}>{formatEuro(proposal.totalCents)}</td>
                  {showMargin ? (
                    <td className={`${td} whitespace-nowrap text-right`}>
                      {proposal.marginPercent === null ? "" : formatPercent(proposal.marginPercent / 100)}
                    </td>
                  ) : null}
                  <td className={td}>
                    <div className={validity.warn ? "font-bold text-warn-foreground" : "font-medium"}>
                      {validity.title}
                    </div>
                    <div className="text-[13px] text-muted">{validity.note}</div>
                  </td>
                  <td className={td}>
                    <StatusPill status={proposal.status} label={t.status[proposal.status]} />
                  </td>
                  <td className="px-2 py-4 text-right">
                    <Link
                      href={localePath(lang, ROUTES.proposals.detail(proposal.id))}
                      aria-label={interpolate(list.open, { id: proposal.id })}
                      className="inline-grid size-9 place-items-center rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <Icon name="chevronRight" size={18} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-[13px] text-muted">
        <span>{pluralize(lang, total, list.showing, { shown: rows.length })}</span>
        {showMargin ? (
          <span className="flex items-center gap-1.5">
            <Icon name="lock" size={14} />
            {list.marginNote}
          </span>
        ) : null}
      </div>
    </>
  );
}
