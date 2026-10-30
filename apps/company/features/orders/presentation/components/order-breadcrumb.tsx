import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { OrdersText } from "../orders-text";

const linkClass = "font-bold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type Props = {
  lang: Locale;
  t: OrdersText;
  current: string;
  /** Nivel intermedio con enlace: "Pedidos > MD-0828 > Inventário". */
  parent?: { label: string; href: string };
};

/** "Pedidos > <página actual>". */
export function OrderBreadcrumb({ lang, t, current, parent }: Props) {
  return (
    <nav aria-label={t.breadcrumb.label} className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <Link href={localePath(lang, ROUTES.orders.list)} className={linkClass}>
        {t.breadcrumb.orders}
      </Link>
      <Icon name="chevronRight" size={14} />
      {parent ? (
        <>
          <Link href={parent.href} className={linkClass}>
            {parent.label}
          </Link>
          <Icon name="chevronRight" size={14} />
        </>
      ) : null}
      <span aria-current="page">{current}</span>
    </nav>
  );
}
