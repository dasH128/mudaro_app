// Anillo giratorio decorativo: hereda el color del texto (`currentColor`). El aviso accesible lo pone quien lo usa.
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
