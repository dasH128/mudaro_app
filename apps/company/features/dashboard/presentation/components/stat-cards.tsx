import { Icon, type IconName } from "@/app/components/icon";
import type { Stat, StatKind } from "@/features/dashboard/domain/types";

const ICONS: Record<StatKind, IconName> = {
  "jobs-today": "truck",
  "in-progress": "pin",
  incidents: "warning",
};

const TONES = {
  warn: "bg-warn-surface text-warn-foreground",
  success: "bg-success-surface text-success-foreground",
  danger: "bg-danger-surface text-danger-foreground",
} as const;

export function StatCards({ stats }: { stats: readonly Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
      {stats.map((stat) => (
        <div key={stat.label} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
          <span className={`grid size-12 flex-none place-items-center rounded-[14px] ${TONES[stat.tone]}`}>
            <Icon name={ICONS[stat.kind]} size={22} />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-muted">{stat.label}</span>
            <span className="font-display text-4xl font-extrabold leading-none">{stat.value}</span>
            <span className="text-[13px] text-muted">
              {stat.delta ? <strong className="text-success-foreground">{stat.delta}</strong> : null}
              {stat.delta ? " " : null}
              {stat.hint}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
