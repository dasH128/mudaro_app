import { interpolate } from "@/app/i18n/interpolate";
import { formatDecimal, formatEuro, formatPercent } from "@/app/lib/format";
import type { ProposalMetrics } from "@/features/proposals/domain/types";
import type { ProposalsText } from "../proposals-text";

type Props = {
  t: ProposalsText;
  summary: { drafts: number; awaitingCount: number; awaitingCents: number };
  metrics: ProposalMetrics;
};

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-5">
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="font-display text-[34px] font-extrabold leading-none">{value}</span>
      <span className="text-[13px] text-muted">{hint}</span>
    </div>
  );
}

export function ProposalsStats({ t, summary, metrics }: Props) {
  const { stats } = t;
  return (
    <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
      <Card label={stats.toSend.label} value={String(summary.drafts)} hint={stats.toSend.hint} />
      <Card
        label={stats.awaiting.label}
        value={String(summary.awaitingCount)}
        hint={interpolate(stats.awaiting.hint, { amount: formatEuro(summary.awaitingCents) })}
      />
      <Card
        label={stats.acceptance.label}
        value={formatPercent(metrics.acceptanceRate)}
        hint={stats.acceptance.hint}
      />
      <Card
        label={stats.timeToProposal.label}
        value={interpolate(stats.timeToProposal.value, { days: formatDecimal(metrics.averageDaysToProposal) })}
        hint={stats.timeToProposal.hint}
      />
    </div>
  );
}
