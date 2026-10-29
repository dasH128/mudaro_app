"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";

export type NavKey = "home" | "orders" | "proposals" | "schedule" | "clients" | "fleet" | "team" | "pricing" | "reports";

type NavItem = { key: NavKey; icon: IconName; route: string; badge?: number };

// Datos de ejemplo: el contador de pedidos saldrá de la base de datos
const NAV: readonly NavItem[] = [
  { key: "home", icon: "home", route: ROUTES.home },
  { key: "orders", icon: "orders", route: ROUTES.orders.list, badge: 5 },
  { key: "proposals", icon: "proposals", route: ROUTES.proposals.list },
  { key: "schedule", icon: "calendar", route: ROUTES.schedule },
  { key: "clients", icon: "clients", route: ROUTES.clients },
  { key: "fleet", icon: "truck", route: ROUTES.fleet },
  { key: "team", icon: "team", route: ROUTES.team },
  { key: "pricing", icon: "tags", route: ROUTES.pricing },
  { key: "reports", icon: "reports", route: ROUTES.reports },
];

const itemBase =
  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const itemIdle = "text-on-ink hover:bg-white/[0.08] hover:text-white";

type Props = { lang: Locale; label: string; labels: Record<NavKey, string> };

// Cliente solo para leer la ruta y marcar el enlace activo.
export function AppNav({ lang, label, labels }: Props) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
    >
      {NAV.map((item) => {
        const href = localePath(lang, item.route);
        // Inicio solo con la ruta exacta; el resto también en sus subrutas (/proposals/PR-0415)
        const active = item.route === ROUTES.home ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={item.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${itemBase} shrink-0 ${active ? "bg-primary font-bold text-primary-foreground" : itemIdle}`}
          >
            <Icon name={item.icon} />
            <span className="lg:flex-1">{labels[item.key]}</span>
            {item.badge ? (
              <span className="rounded-full bg-white/[0.14] px-2 py-0.5 text-xs font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
