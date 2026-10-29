import type { ReactNode } from "react";

/** Clases de un campo de texto de 48 px (16 px de letra: iOS no hace zoom al enfocar). */
export const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-field-border bg-surface px-3.5 text-base text-foreground outline-none placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:border-danger-dot";

/** Une los ids de la ayuda y del error que existan, para `aria-describedby`. */
export function describedBy(id: string, { hint, error }: { hint?: boolean; error?: boolean }): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

type Props = {
  id: string;
  label: ReactNode;
  /** Muestra el asterisco de obligatorio. */
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
};

/** Etiqueta, campo, ayuda y error. El campo debe llevar `id`, `aria-invalid` y `aria-describedby={describedBy(...)}`. */
export function Field({ id, label, required, hint, error, children }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger-foreground">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <span id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} role="alert" className="text-[13px] font-medium text-danger-foreground">
          {error}
        </span>
      ) : null}
    </div>
  );
}
