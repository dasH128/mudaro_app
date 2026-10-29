import Link from "next/link";

import { Icon } from "@/app/components/icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { ActivityItem, ActivityTone } from "@/features/dashboard/domain/types";

const card = "flex flex-col rounded-2xl border border-line bg-surface p-6";
const cardTitle = "flex items-center gap-2.5 font-display text-xl font-extrabold";

// Accesos fijos de la interfaz (no son datos de la empresa).
const SHORTCUTS = [
  { label: "Calculadora de volume", icon: "calculator", route: ROUTES.tools.volumeCalculator },
  { label: "Nova proposta", icon: "proposals", route: ROUTES.proposals.new },
  { label: "Tarifas e extras", icon: "tags", route: ROUTES.pricing },
  { label: "Enviar link ao cliente", icon: "link", route: ROUTES.orders.new },
] as const;

const LEGEND = [
  { label: "Em serviço", value: 8, swatch: "bg-foreground" },
  { label: "Em carga", value: 2, swatch: "bg-primary" },
  { label: "Disponíveis", value: 2, swatch: "bg-accent" },
] as const;

export function FleetSummary({ lang }: { lang: Locale }) {
  return (
    <section aria-labelledby="fleet" className={`${card} gap-[18px]`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="fleet" className={cardTitle}>
          <Icon name="truck" size={22} />
          Resumo da frota
        </h2>
        <Link href={localePath(lang, ROUTES.fleet)} className="text-[13px] font-bold">
          Ver frota
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        {/* Donut: circunferencia 2π·52 ≈ 326,7; cada arco deja un hueco de 2 px */}
        <svg
          width="128"
          height="128"
          viewBox="0 0 128 128"
          role="img"
          aria-label="12 veículos: 8 em serviço, 2 em carga, 2 disponíveis"
        >
          <circle cx="64" cy="64" r="52" fill="none" strokeWidth="14" className="stroke-line-soft" />
          <circle cx="64" cy="64" r="52" fill="none" strokeWidth="14" strokeDasharray="215.8 110.9" strokeDashoffset="0" transform="rotate(-90 64 64)" className="stroke-foreground" />
          <circle cx="64" cy="64" r="52" fill="none" strokeWidth="14" strokeDasharray="52.5 274.2" strokeDashoffset="-217.8" transform="rotate(-90 64 64)" className="stroke-primary" />
          <circle cx="64" cy="64" r="52" fill="none" strokeWidth="14" strokeDasharray="52.5 274.2" strokeDashoffset="-272.2" transform="rotate(-90 64 64)" className="stroke-accent" />
          <text x="64" y="64" textAnchor="middle" fontSize="30" fontWeight="800" className="fill-foreground font-display">
            12
          </text>
          <text x="64" y="84" textAnchor="middle" fontSize="12" className="fill-muted">
            veículos
          </text>
        </svg>
        <ul className="flex min-w-35 flex-1 flex-col gap-3 text-sm">
          {LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5">
              <span className={`size-2.5 rounded-[3px] ${item.swatch}`} />
              <span className="flex-1">{item.label}</span>
              <strong>{item.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const DOT: Record<ActivityTone, string> = {
  primary: "bg-primary",
  ink: "bg-foreground",
  success: "bg-success-dot",
  danger: "bg-danger-dot",
};

export function RecentActivity({ lang, activity }: { lang: Locale; activity: readonly ActivityItem[] }) {
  return (
    <section aria-labelledby="activity" className={`${card} gap-4`}>
      <h2 id="activity" className={cardTitle}>
        <Icon name="clock" size={22} />
        Atividade recente
      </h2>
      <ol className="flex flex-col gap-4">
        {activity.map((item) => (
          <li key={item.ref} className="flex items-start gap-3">
            <span className={`mt-1.5 size-[9px] flex-none rounded-full ${DOT[item.tone]}`} />
            <span className="w-10 flex-none pt-px text-[13px] text-muted">{item.time}</span>
            <span className="flex flex-col gap-0.5 text-sm">
              <span>
                <strong>{item.ref}</strong> · {item.text}
              </span>
              <span className="text-[13px] text-muted">{item.sub}</span>
            </span>
          </li>
        ))}
      </ol>
      <Link href={localePath(lang, ROUTES.activity)} className="text-[13px] font-bold">
        Ver toda a atividade
      </Link>
    </section>
  );
}

export function Shortcuts({ lang }: { lang: Locale }) {
  return (
    <section aria-labelledby="shortcuts" className={`${card} gap-4`}>
      <h2 id="shortcuts" className="font-display text-xl font-extrabold">
        Atalhos
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.label}
            href={localePath(lang, item.route)}
            className="flex items-center gap-2.5 rounded-xl border border-line-soft p-3 text-sm font-medium hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-background">
              <Icon name={item.icon} size={18} />
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
