export function SectionHeading({ step, children }: { step: number; children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-8 flex-none place-items-center rounded-full bg-foreground text-sm font-bold text-background"
      >
        {step}
      </span>
      <h2 className="font-display text-[22px] font-extrabold">{children}</h2>
    </div>
  );
}
