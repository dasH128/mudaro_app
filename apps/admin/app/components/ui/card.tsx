import { useId, type ReactNode } from "react";

type CardProps = {
  title: string;
  /** Texto pequeño bajo el título. */
  description?: string;
  /** Texto a la derecha del título. */
  aside?: ReactNode;
  children: ReactNode;
};

export function Card({ title, description, aside, children }: CardProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-[18px] rounded-2xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="m-0 text-lg font-bold">
            {title}
          </h2>
          {description && <p className="m-0 text-sm text-muted">{description}</p>}
        </div>
        {aside && <span className="text-sm text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
