"use client";

/** Abre el diálogo de impresión del navegador. No sale en la hoja impresa. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 cursor-pointer items-center rounded-full bg-foreground px-5 text-sm font-bold text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary print:hidden"
    >
      {label}
    </button>
  );
}
