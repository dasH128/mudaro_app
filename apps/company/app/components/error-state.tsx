import Link from "next/link";
import type { ReactNode } from "react";

type Action = { label: string; href: string };

type Props = {
  /** Ilustración decorativa (ver error-art.tsx). */
  art: ReactNode;
  title: string;
  text: string;
  action: Action;
  secondary?: Action;
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Pantalla de error dentro del panel: ilustración, título, explicación y una salida clara.
 * La usan los `not-found.tsx` (y más adelante `error.tsx`). Nunca muestra mensajes técnicos.
 */
export function ErrorState({ art, title, text, action, secondary }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-115 flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      {art}
      <h1 className="mt-1 font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h1>
      <p className="text-base leading-[1.55] text-muted">{text}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2.5">
        <Link
          href={action.href}
          className={`inline-flex h-11 items-center rounded-full bg-primary px-5 text-[15px] font-bold text-primary-foreground shadow-md ${focusRing}`}
        >
          {action.label}
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className={`inline-flex h-11 items-center rounded-full border border-field-border bg-surface px-5 text-[15px] font-bold text-foreground ${focusRing}`}
          >
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
