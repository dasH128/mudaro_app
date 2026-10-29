"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { Icon } from "@/app/components/app-icon";

export const SIDEBAR_COOKIE = "sidebar_collapsed";

const SidebarContext = createContext<{ collapsed: boolean; toggle: () => void } | null>(null);

type SidebarShellProps = {
  /** Estado leído de la cookie en el servidor, para no parpadear al cargar. */
  initialCollapsed: boolean;
  sidebar: ReactNode;
  children: ReactNode;
};

/**
 * Cuadrícula del layout con el menú lateral plegable (solo escritorio).
 * El estado vive en un atributo `data-collapsed`; los hijos lo leen con variantes
 * `group-data-[collapsed=true]/shell:` de Tailwind, sin pasar props.
 */
export function SidebarShell({ initialCollapsed, sidebar, children }: SidebarShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <SidebarContext value={{ collapsed, toggle }}>
      <div
        data-collapsed={collapsed}
        className="group/shell grid flex-1 lg:grid-cols-[248px_minmax(0,1fr)] lg:data-[collapsed=true]:grid-cols-[76px_minmax(0,1fr)]"
      >
        {sidebar}
        <main className="flex min-w-0 flex-col gap-6 px-4 py-7 sm:px-8 lg:px-10 lg:pb-10">
          {children}
        </main>
      </div>
    </SidebarContext>
  );
}

/** Botón para plegar o desplegar el menú. Solo se ve en escritorio. */
export function SidebarToggle({ labels }: { labels: { collapse: string; expand: string } }) {
  const ctx = useContext(SidebarContext);
  if (!ctx) return null;
  const label = ctx.collapsed ? labels.expand : labels.collapse;

  return (
    <button
      type="button"
      onClick={ctx.toggle}
      aria-expanded={!ctx.collapsed}
      aria-label={label}
      title={label}
      className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium text-on-ink hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Icon name="chevronRight" className={ctx.collapsed ? "" : "rotate-180"} />
      <span className="lg:group-data-[collapsed=true]/shell:hidden">{label}</span>
    </button>
  );
}
