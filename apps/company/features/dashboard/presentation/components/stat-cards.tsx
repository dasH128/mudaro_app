import { Icon, type IconName } from "@/app/components/app-icon";
import type { Stat, StatKind } from "@/features/dashboard/domain/types";
import type { HomeText } from "../home-text";

const ICONS: Record<StatKind, IconName> = {
  "jobs-today": "truck",
  "in-progress": "pin",
  incidents: "warning",
};

/** Clave del texto de cada tarjeta en el diccionario. */
const TEXT_KEY = { "jobs-today": "jobsToday", "in-progress": "inProgress", incidents: "incidents" } as const;

const TONES = {
  warn: "bg-warn-surface text-warn-foreground",
  success: "bg-success-surface text-success-foreground",
  danger: "bg-danger-surface text-danger-foreground",
} as const;

export function StatCards({ t, stats }: { t: HomeText; stats: readonly Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
      {stats.map((stat) => {
        const text = t.stats[TEXT_KEY[stat.kind]];
        return (
          <div key={stat.kind} className="flex gap-3.5 rounded-[20px] border border-line bg-surface px-4.5 py-4">
            <span className={`grid size-10 flex-none place-items-center rounded-xl ${TONES[stat.tone]}`}>
              <Icon name={ICONS[stat.kind]} size={20} />
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-muted">{text.label}</span>
              <span className="font-display text-4xl font-extrabold leading-none">{stat.value}</span>
              <span className="text-[13px] text-muted">
                {stat.delta ? <strong className="text-success-foreground">{stat.delta > 0 ? `+${stat.delta}` : stat.delta}</strong> : null}
                {stat.delta ? " " : null}
                {text.hint}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
