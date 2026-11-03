import type { ReactNode } from "react";

export type PillTone = "outline" | "setup" | "solid" | "muted" | "warn";

const TONE: Record<PillTone, string> = {
  outline: "border-field-border bg-surface text-foreground",
  setup: "border-accent bg-status-config-surface text-foreground",
  solid: "border-foreground bg-foreground text-background",
  muted: "border-status-off-border bg-line-soft text-muted",
  warn: "border-warn-border bg-warn-surface text-warn-foreground",
};

const SIZE = {
  md: "px-2.5 py-1 text-[13px]",
  sm: "px-[9px] py-[3px] text-xs",
} as const;

export function StatusPill({ tone, size = "md", children }: { tone: PillTone; size?: keyof typeof SIZE; children: ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border font-bold ${SIZE[size]} ${TONE[tone]}`}>{children}</span>
  );
}
