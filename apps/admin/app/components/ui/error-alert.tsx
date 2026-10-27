import type { ReactNode } from "react";

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger-border bg-danger-surface px-3.5 py-3 text-sm leading-[1.45] text-danger-foreground"
    >
      {children}
    </div>
  );
}
