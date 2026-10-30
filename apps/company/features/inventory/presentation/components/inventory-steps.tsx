import type { InventoryStep } from "../../domain/types";
import { INVENTORY_STEPS } from "../../domain/types";
import type { InventoryText } from "../inventory-text";

export const stepTabId = (step: InventoryStep) => `inventory-tab-${step}`;
export const STEP_PANEL_ID = "inventory-panel";

type Props = {
  t: InventoryText;
  current: InventoryStep;
  /** Subtítulo de cada paso, ya con sus cifras. */
  hints: Record<InventoryStep, string>;
  onPick: (step: InventoryStep) => void;
};

/** Los tres pasos del inventario como pestañas. Los anteriores al actual se marcan como hechos. */
export function InventorySteps({ t, current, hints, onPick }: Props) {
  const currentIndex = INVENTORY_STEPS.indexOf(current);

  return (
    <div role="tablist" aria-label={t.stepsLabel} className="grid gap-2.5 sm:grid-cols-3">
      {INVENTORY_STEPS.map((step, index) => {
        const selected = step === current;
        const done = index < currentIndex;
        return (
          <button
            key={step}
            id={stepTabId(step)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={STEP_PANEL_ID}
            onClick={() => onPick(step)}
            className={`flex cursor-pointer items-center gap-3 rounded-[18px] px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              selected ? "border-2 border-foreground bg-surface" : "border border-line bg-surface-soft"
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid size-9 flex-none place-items-center rounded-full font-bold ${
                selected
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-foreground text-background"
                    : "border-2 border-dashed border-accent bg-surface text-muted"
              }`}
            >
              {done ? "✓" : index + 1}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-bold">{t.steps[step].label}</span>
              <span className="text-[13px] text-muted">{hints[step]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
