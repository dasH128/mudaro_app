import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { orderDetailHref } from "../orders-href";

/**
 * Número de pedido que lleva al detalle. Su `::after` cubre el contenedor más cercano con `relative`,
 * así que toda la fila es clicable sin anidar enlaces. Lo que deba seguir siendo pulsable (botones de
 * acción) lleva `relative` para quedar por encima.
 */
export function OrderIdLink({ lang, id }: { lang: Locale; id: string }) {
  return (
    <Link
      href={orderDetailHref(lang, id)}
      className="text-[13px] text-muted after:absolute after:inset-0 after:content-[''] hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {id}
    </Link>
  );
}
