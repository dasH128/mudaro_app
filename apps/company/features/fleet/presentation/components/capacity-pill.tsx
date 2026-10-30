"use client";

import { useCallback, useRef, useState } from "react";

import { useDismiss } from "@/app/components/use-dismiss";

type Props = {
  /** "86 m³" ya formateado. */
  capacity: string;
  suffix: string;
  help: { label: string; title: string; text: string; exampleVolume: string; exampleResult: string };
};

// Cliente solo por el desplegable de ayuda: cierra con Escape o al hacer clic fuera.
export function CapacityPill({ capacity, suffix, help }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, root, close);

  return (
    <div ref={root} className="relative">
      <span className="inline-flex h-8.5 items-center gap-2 rounded-full bg-foreground pr-1.5 pl-3.5 text-sm text-background">
        <strong className="font-display text-[17px]">{capacity}</strong> {suffix}
        <button
          type="button"
          aria-label={help.label}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="size-6 cursor-pointer rounded-full bg-background/20 text-[13px] font-bold text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          ?
        </button>
      </span>
      {open ? (
        <div
          role="note"
          className="absolute top-11 left-0 z-10 flex w-105 max-w-[90vw] flex-col gap-2 rounded-[18px] border border-accent bg-status-config-surface px-5 py-4.5 text-sm leading-normal shadow-[0_16px_40px_rgba(27,31,59,0.15)]"
        >
          <strong>{help.title}</strong>
          <span>{help.text}</span>
          <span className="flex flex-wrap items-center gap-1.5 text-[13px]">
            <span className="rounded-[10px] bg-surface-soft px-2.5 py-1 font-bold">{help.exampleVolume}</span>→
            <span className="rounded-[10px] bg-foreground px-2.5 py-1 font-bold text-background">{help.exampleResult}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
