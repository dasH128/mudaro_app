/** Círculo con check (hecho) o con borde discontinuo (pendiente). Decorativo: el estado va en texto. */
export function StepIcon({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
        done ? "bg-foreground text-background" : "box-border border-[1.5px] border-dashed border-field-border"
      }`}
    >
      {done && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12l5 5L20 7" />
        </svg>
      )}
    </span>
  );
}
