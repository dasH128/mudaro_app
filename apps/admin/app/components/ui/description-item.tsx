import type { ReactNode } from "react";

/** Par término/valor para usar dentro de un <dl>. */
export function DescriptionItem({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[13px] text-muted">{term}</dt>
      <dd className="m-0 text-[15px] font-medium">{children}</dd>
    </div>
  );
}
