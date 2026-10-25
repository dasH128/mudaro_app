import { StatusPill, type PillTone } from "@/app/components/ui/status-pill";
import { STATUS_LABEL, type CompanyStatus } from "@/features/companies/domain/status";

export const STATUS_TONE: Record<CompanyStatus, PillTone> = {
  invitation: "outline",
  setup: "setup",
  active: "solid",
  deactivated: "muted",
};

export function StatusBadge({ status }: { status: CompanyStatus }) {
  return <StatusPill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusPill>;
}
