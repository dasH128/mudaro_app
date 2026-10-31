import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { OrdersListText } from "../orders-text";

type Props = { lang: Locale; t: OrdersListText };

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function OrdersListHeader({ lang, t }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">
          {t.title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={localePath(lang, ROUTES.orders.new)}
          className={`flex h-12 items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground shadow-md ${focus}`}
        >
          <Icon name="plus" size={18} strokeWidth={2.5} />
          {t.new}
        </Link>
      </div>
    </header>
  );
}
