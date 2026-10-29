import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";

/** "quinta-feira, 29 de outubro de 2026" con la primera letra en mayúscula. */
function formatToday(): string {
  const text = new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const control =
  "grid size-11 place-items-center rounded-xl border border-line bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function DashboardHeader({ lang }: { lang: Locale }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
          Mudaro · Centro de operações
        </span>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">
          Operações de hoje
        </h1>
        <p className="text-base text-muted">{formatToday()} · Resumo de atividade</p>
      </div>

      <div className="flex w-full flex-col gap-5 sm:w-auto sm:items-end">
        <div className="flex flex-wrap items-center gap-3.5">
          <label className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary sm:w-80">
            <Icon name="search" size={18} className="text-muted" />
            <span className="sr-only">Pesquisar</span>
            <input
              type="search"
              placeholder="Pesquisar pedido, cliente, veículo…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-field-placeholder"
            />
          </label>
          <button type="button" aria-label="Notificações, 2 novas" className={`${control} relative`}>
            <Icon name="bell" />
            <span className="absolute top-[9px] right-2.5 size-[9px] rounded-full border-2 border-surface bg-primary" />
          </button>
          <button
            type="button"
            aria-label="Menu da conta"
            className="flex h-11 items-center gap-2 rounded-xl pr-2 pl-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="grid size-10 place-items-center rounded-full bg-foreground text-sm font-bold text-background">
              GH
            </span>
            <Icon name="chevronDown" size={16} />
          </button>
        </div>
        <Link
          href={localePath(lang, ROUTES.orders.new)}
          className="flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-5.5 text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Icon name="plus" size={18} strokeWidth={2.5} />
          Novo pedido
        </Link>
      </div>
    </header>
  );
}
