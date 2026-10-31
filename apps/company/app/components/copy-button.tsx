"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Lo que se copia al portapapeles. */
  text: string;
  label: string;
  copiedLabel: string;
  /** "pill": botón con borde. "link": enlace subrayado dentro de una fila. */
  variant?: "pill" | "link";
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const pill = `h-10 cursor-pointer rounded-full border px-4 text-sm font-bold ${focusRing}`;
const link = `cursor-pointer text-[13px] font-bold text-foreground underline ${focusRing}`;

// Cliente solo por el portapapeles. "Copiado ✓" vuelve a la etiqueta inicial a los 2 s.
export function CopyButton({ text, label, copiedLabel, variant = "pill" }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Sin permiso para el portapapeles (o sin HTTPS): el botón no hace nada
    }
  }

  const look =
    variant === "link"
      ? link
      : `${pill} ${copied ? "border-success-border bg-success-surface text-success-foreground" : "border-field-border bg-surface text-foreground"}`;

  return (
    <button type="button" onClick={copy} className={look}>
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
