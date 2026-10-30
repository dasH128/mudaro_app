import { STEP_OF } from "@/features/orders/domain/list";
import type { OrderStage } from "@/features/orders/domain/types";

/** Cinco puntos con el avance del pedido. */
export function OrderSteps({ stage, label }: { stage: OrderStage; label: string }) {
  const step = STEP_OF[stage];
  const on = stage === "lost" ? "bg-danger-border" : stage === "won" ? "bg-success-dot" : "bg-foreground";

  return (
    <span role="img" aria-label={label} className="inline-flex gap-0.75">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`h-1.25 w-4 rounded-full ${n <= step ? on : "bg-line-soft"}`} />
      ))}
    </span>
  );
}
