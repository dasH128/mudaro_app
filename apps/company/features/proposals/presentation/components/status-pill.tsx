import type { ProposalStatus } from "@/features/proposals/domain/types";

const PILL: Record<ProposalStatus, string> = {
  draft: "border-status-off-border bg-line-soft text-muted",
  sent: "border-foreground bg-surface text-foreground",
  accepted: "border-success-border bg-success-surface text-success-foreground",
  rejected: "border-danger-border bg-danger-surface text-danger-foreground",
  expired: "border-dashed border-field-border bg-surface text-muted",
  superseded: "border-status-off-border bg-surface-soft text-muted",
};

export function StatusPill({ status, label }: { status: ProposalStatus; label: string }) {
  return (
    <span
      className={`inline-flex h-7 items-center whitespace-nowrap rounded-full border px-3 text-[13px] font-bold ${PILL[status]}`}
    >
      {label}
    </span>
  );
}
