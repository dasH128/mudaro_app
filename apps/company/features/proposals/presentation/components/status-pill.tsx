import type { ProposalStatus } from "@/features/proposals/domain/types";

const PILL: Record<ProposalStatus, string> = {
  draft: "bg-line-soft text-muted",
  sent: "bg-foreground text-background",
  accepted: "bg-success-surface text-success-foreground",
  rejected: "bg-danger-surface text-danger-foreground",
  expired: "bg-warn-surface text-warn-foreground",
  superseded: "bg-surface-head text-muted",
};

export function StatusPill({ status, label }: { status: ProposalStatus; label: string }) {
  return (
    <span
      className={`inline-flex h-6.5 items-center self-start whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${PILL[status]}`}
    >
      {label}
    </span>
  );
}
