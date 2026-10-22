import type { ReactNode } from "react";

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="m-0 font-display text-[32px] leading-[1.15] font-extrabold tracking-[-0.02em]">{children}</h1>
  );
}
