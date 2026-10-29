import Link from "next/link";

import { MudaroSymbol } from "@mudaro/ui";
import { Icon, type IconName } from "@/app/components/icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";

type NavItem = { label: string; icon: IconName; route: string; badge?: number };

// Datos de ejemplo: la empresa y el usuario saldrán de la sesión
const NAV: NavItem[] = [
  { label: "Início", icon: "home", route: ROUTES.home },
  { label: "Pedidos", icon: "orders", route: ROUTES.orders.list, badge: 5 },
  { label: "Propostas", icon: "proposals", route: ROUTES.proposals.list },
  { label: "Agenda", icon: "calendar", route: ROUTES.schedule },
  { label: "Clientes", icon: "clients", route: ROUTES.clients },
  { label: "Frota", icon: "truck", route: ROUTES.fleet },
  { label: "Equipa", icon: "team", route: ROUTES.team },
  { label: "Tarifas", icon: "tags", route: ROUTES.pricing },
  { label: "Relatórios", icon: "reports", route: ROUTES.reports },
];

const itemBase =
  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const itemIdle = "text-on-ink hover:bg-white/[0.08] hover:text-white";

export function AppSidebar({ lang }: { lang: Locale }) {
  return (
    <aside className="flex flex-col gap-4 bg-sidebar px-4 py-4 text-on-ink lg:sticky lg:top-0 lg:h-screen lg:gap-7 lg:px-4.5 lg:pt-7 lg:pb-6">
      <Link
        href={localePath(lang, ROUTES.home)}
        className="flex items-center gap-2.5 px-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <MudaroSymbol variant="light" className="h-10.25 w-auto" />
        <span className="font-display text-[26px] font-extrabold tracking-tight text-white">
          MUDARO
        </span>
      </Link>

      <div className="mx-1 hidden flex-col gap-0.5 rounded-xl border border-white/15 px-3.5 py-3 lg:flex">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Empresa
        </span>
        <span className="text-[15px] font-bold text-white">Mudanças Atlântico, Lda.</span>
      </div>

      <nav
        aria-label="Menu principal"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
      >
        {NAV.map((item, i) => {
          const active = i === 0;
          return (
            <Link
              key={item.label}
              href={localePath(lang, item.route)}
              aria-current={active ? "page" : undefined}
              className={`${itemBase} shrink-0 ${
                active ? "bg-primary font-bold text-primary-foreground" : itemIdle
              }`}
            >
              <Icon name={item.icon} />
              <span className="lg:flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-white/[0.14] px-2 py-0.5 text-xs font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden flex-col gap-4 lg:flex">
        <Link href={localePath(lang, ROUTES.settings)} className={`${itemBase} ${itemIdle}`}>
          <Icon name="settings" />
          Configurações
        </Link>
        <div className="flex items-center gap-3 border-t border-white/15 px-3 pt-3.5">
          <span className="grid size-10 place-items-center rounded-full bg-on-ink text-sm font-bold text-primary-foreground">
            GH
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-bold text-white">Olá, Gema</span>
            <span className="text-[13px] text-on-ink">Administradora</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
