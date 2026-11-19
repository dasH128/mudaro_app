import { Icon } from "@/app/components/app-icon";
import type { InventoryError, InventoryStep } from "../../domain/types";
import type { InventoryText } from "../inventory-text";

/** Estado del último guardado del borrador. */
export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; error: InventoryError };

type Props = {
  t: InventoryText;
  step: InventoryStep;
  /** "12 itens · 3,4 m³", ya formateado. */
  totals: string;
  status: SaveStatus;
  pending: boolean;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
};

const primary =
  "inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-wait disabled:opacity-60";

/** Barra fija con los totales, el estado del guardado y la navegación entre pasos. Compensa el padding del <main>. */
export function InventoryFooter({ t, step, totals, status, pending, onBack, onNext, onFinish }: Props) {
  const f = t.footer;
  const last = step === "extras";

  return (
    <div className="sticky bottom-0 z-10 -mx-4 -mb-7 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-4 sm:-mx-8 sm:px-8 lg:-mx-10 lg:-mb-10 lg:px-10">
      <span className="flex flex-col gap-0.5 text-sm text-muted">
        <span>
          <strong className="text-foreground">{totals}</strong> · {last ? f.hintLast : f.hint}
        </span>
        {/* Anuncia el guardado sin mover el foco; los errores, con prioridad */}
        <span
          role={status.kind === "error" ? "alert" : "status"}
          className={status.kind === "error" ? "font-bold text-danger-foreground" : undefined}
        >
          {status.kind === "saving"
            ? t.save.saving
            : status.kind === "saved"
              ? t.save.saved
              : status.kind === "error"
                ? t.errors[status.error]
                : ""}
        </span>
      </span>
      <div className="flex flex-wrap items-center gap-2.5">
        {step !== "items" ? (
          <button
            type="button"
            onClick={onBack}
            disabled={pending}
            className="h-12 cursor-pointer rounded-full border border-field-border bg-surface px-4.5 text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
          >
            {f.back}
          </button>
        ) : null}
        {last ? (
          <button type="button" onClick={onFinish} disabled={pending} className={primary}>
            <Icon name="check" size={18} strokeWidth={2.4} />
            {f.finish}
          </button>
        ) : (
          <button type="button" onClick={onNext} disabled={pending} className={primary}>
            {step === "items" ? f.toAccess : f.toExtras}
            <Icon name="arrowRight" size={18} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  );
}
