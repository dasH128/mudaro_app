import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { OrdersText } from "../orders-text";

/** "Pedidos > <página actual>". */
export function OrderBreadcrumb({ lang, t, current }: { lang: Locale; t: OrdersText; current: string }) {
  return (
    <nav aria-label={t.breadcrumb.label} className="flex items-center gap-2 text-sm text-muted">
      <Link
        href={localePath(lang, ROUTES.orders.list)}
        className="font-bold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {t.breadcrumb.orders}
      </Link>
      <Icon name="chevronRight" size={14} />
      <span aria-current="page">{current}</span>
    </nav>
  );
}
