import { initials } from "@/features/orders/domain/client-name";
import type { JobStatus } from "../../domain/types";

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const PILL: Record<JobStatus, string> = {
  scheduled: "bg-info-surface text-foreground",
  "in-progress": "bg-primary text-primary-foreground",
  delivered: "bg-success-surface text-success-foreground",
  closed: "bg-line-soft text-muted",
};

/** Pastilla de estado del trabajo. */
export function JobStatusPill({ status, label }: { status: JobStatus; label: string }) {
  return (
    <span className={`inline-flex h-6.5 items-center self-start whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${PILL[status]}`}>
      {label}
    </span>
  );
}

/** Iniciales de una persona ("André Lopes" → "AL"). */
export const initialsOf = (name: string): string => initials(name);
