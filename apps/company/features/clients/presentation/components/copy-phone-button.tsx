"use client";

import { useEffect, useState } from "react";

type Props = { phone: string; label: string; copiedLabel: string };

const base =
  "h-10 cursor-pointer rounded-full border px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// Cliente solo por el portapapeles. "Copiado ✓" vuelve a "Copiar telemóvel" a los 2 s.
export function CopyPhoneButton({ phone, label, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
    } catch {
      // Sin permiso para el portapapeles (o sin HTTPS): el botón no hace nada
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`${base} ${copied ? "border-success-border bg-success-surface text-success-foreground" : "border-field-border bg-surface text-foreground"}`}
    >
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
