import type { ReactNode } from "react";

export type PillTone = "outline" | "config" | "solid" | "muted" | "warn";

const TONE: Record<PillTone, string> = {
  outline: "border-field-border bg-surface text-foreground",
  config: "border-accent bg-status-config-surface text-foreground",
  solid: "border-foreground bg-foreground text-background",
  muted: "border-status-off-border bg-line-soft text-muted",
  warn: "border-warn-border bg-warn-surface text-warn-foreground",
};

export function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-[13px] font-bold ${TONE[tone]}`}>{children}</span>
  );
}
