import type { OrderStage } from "@/features/orders/domain/types";

const PILL: Record<OrderStage, string> = {
  new: "bg-line-soft text-muted",
  "awaiting-inventory": "bg-info-surface text-foreground",
  "inventory-received": "bg-primary text-primary-foreground",
  quoted: "border border-accent bg-background text-foreground",
  won: "bg-success-surface text-success-foreground",
  lost: "bg-danger-surface text-danger-foreground",
};

export function OrderStagePill({ stage, label }: { stage: OrderStage; label: string }) {
  return (
    <span
      className={`inline-flex h-6.5 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${PILL[stage]}`}
    >
      {label}
    </span>
  );
}
