import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { InventoryStep } from "../../domain/types";
import type { InventoryText } from "../inventory-text";

type Props = {
  t: InventoryText;
  step: InventoryStep;
  /** "12 itens · 3,4 m³", ya formateado. */
  totals: string;
  finishHref: string;
  onBack: () => void;
  onNext: () => void;
};

const primary =
  "inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

/** Barra fija con los totales y la navegación entre pasos. Compensa el padding del <main>. */
export function InventoryFooter({ t, step, totals, finishHref, onBack, onNext }: Props) {
  const f = t.footer;
  const last = step === "extras";

  return (
    <div className="sticky bottom-0 z-10 -mx-4 -mb-7 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-4 sm:-mx-8 sm:px-8 lg:-mx-10 lg:-mb-10 lg:px-10">
      <span className="text-sm text-muted">
        <strong className="text-foreground">{totals}</strong> · {last ? f.hintLast : f.hint}
      </span>
      <div className="flex flex-wrap items-center gap-2.5">
        {step !== "items" ? (
          <button
            type="button"
            onClick={onBack}
            className="h-12 cursor-pointer rounded-full border border-field-border bg-surface px-4.5 text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {f.back}
          </button>
        ) : null}
        {last ? (
          <Link href={finishHref} className={primary}>
            <Icon name="check" size={18} strokeWidth={2.4} />
            {f.finish}
          </Link>
        ) : (
          <button type="button" onClick={onNext} className={primary}>
            {step === "items" ? f.toAccess : f.toExtras}
            <Icon name="arrowRight" size={18} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  );
}
