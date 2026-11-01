import type { ReactNode } from "react";

// Cabecera de sección: etiqueta, título y, opcionalmente, un texto a la derecha para ahorrar altura
export function SectionHeading({
  label,
  title,
  children,
  tone = "default",
}: {
  label: string;
  title: ReactNode;
  children?: ReactNode;
  tone?: "default" | "ink";
}) {
  return (
    <div className="grid items-end gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
      <div>
        <p
          className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${tone === "ink" ? "text-on-ink" : "text-muted"}`}
        >
          <span className="h-0.5 w-6 bg-primary" aria-hidden="true" />
          {label}
        </p>
        <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h2>
      </div>
      {children ? (
        <p className={`leading-relaxed ${tone === "ink" ? "text-on-ink" : "text-muted"}`}>{children}</p>
      ) : null}
    </div>
  );
}
