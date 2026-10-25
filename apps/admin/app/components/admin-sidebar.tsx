"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MudaroSymbol } from "@mudaro/ui";

import { ROUTES } from "@/app/lib/routes";

const itemClass =
  "flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background";

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

type AdminSidebarProps = {
  userName: string;
};

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const inCompanies = pathname === ROUTES.companies.list || pathname.startsWith(`${ROUTES.companies.list}/`);
  const current = pathname === ROUTES.companies.list ? "page" : inCompanies ? "true" : undefined;

  return (
    <nav
      aria-label="Painel interno"
      className="box-border flex max-w-full flex-[1_1_240px] flex-col gap-7 bg-foreground px-4 py-6 text-background"
    >
      <div className="flex items-center gap-2.5 px-2">
        <div aria-hidden="true">
          <MudaroSymbol variant="light" className="h-9 w-[30px]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-[20px] leading-none font-extrabold tracking-[-0.5px]">MUDARO</span>
          <span className="text-xs font-medium text-on-ink">Painel interno</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Link
          href={ROUTES.companies.list}
          aria-current={current}
          className={`${itemClass} ${inCompanies ? "bg-background text-foreground" : "text-background"}`}
        >
          <svg {...iconProps}>
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-6h6v6" />
          </svg>
          Empresas
        </Link>

        {/* Sin pantalla todavía: se muestran inertes hasta que existan sus rutas. */}
        <span aria-disabled="true" className={`${itemClass} cursor-not-allowed text-background opacity-70`}>
          <svg {...iconProps}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Catálogo de objetos
          <span className="sr-only">(em breve)</span>
        </span>
        <span aria-disabled="true" className={`${itemClass} cursor-not-allowed text-background opacity-70`}>
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5" />
            <path d="M12 17h.01" />
          </svg>
          Suporte
          <span className="sr-only">(em breve)</span>
        </span>
      </div>

      <div className="grow" />

      <div className="flex items-center gap-2.5 px-2 text-sm">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground"
        >
          M
        </span>
        <span>{userName}</span>
      </div>
    </nav>
  );
}
