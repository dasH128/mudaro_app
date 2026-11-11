import Link from "next/link";
import type { ReactNode } from "react";

/** Salida de la pantalla: un enlace o, desde un componente de cliente, un botón (p. ej. reintentar). */
type Action = { label: string; href: string } | { label: string; onClick: () => void };

type Props = {
  /** Ilustración decorativa (ver error-art.tsx). */
  art: ReactNode;
  title: string;
  text: string;
  action: Action;
  secondary?: Action;
  /** Texto pequeño bajo los botones, p. ej. el código de referencia de un error. */
  footnote?: string;
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const primary = `inline-flex h-11 cursor-pointer items-center rounded-full bg-primary px-5 text-[15px] font-bold text-primary-foreground shadow-md ${focusRing}`;
const secondaryClass = `inline-flex h-11 cursor-pointer items-center rounded-full border border-field-border bg-surface px-5 text-[15px] font-bold text-foreground ${focusRing}`;

function ActionButton({ action, className }: { action: Action; className: string }) {
  if ("href" in action) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

/**
 * Pantalla de error dentro del panel: ilustración, título, explicación y una salida clara.
 * La usan los `not-found.tsx` (servidor) y `error.tsx` (cliente). Nunca muestra mensajes técnicos.
 */
export function ErrorState({ art, title, text, action, secondary, footnote }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-115 flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      {art}
      <h1 className="mt-1 font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h1>
      <p className="text-base leading-[1.55] text-muted">{text}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2.5">
        <ActionButton action={action} className={primary} />
        {secondary ? <ActionButton action={secondary} className={secondaryClass} /> : null}
      </div>
      {footnote ? (
        <p className="mt-2 rounded-lg border border-dashed border-line bg-surface px-2.5 py-1 font-mono text-xs text-muted select-all">
          {footnote}
        </p>
      ) : null}
    </section>
  );
}
