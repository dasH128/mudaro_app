import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDateTime } from "@/app/lib/format";
import { openInventoryDraftAction } from "@/features/inventory/application/actions/inventory";
import type { InventoryText } from "../inventory-text";

type Props = {
  lang: Locale;
  t: InventoryText;
  /** Número visible del pedido (MD-0836). */
  orderId: string;
  version: number;
  submittedAt: string;
  detailHref: string;
};

const button =
  "inline-flex h-12 cursor-pointer items-center rounded-full px-5.5 text-base font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * El inventario ya se envió y no hay borrador. Una versión enviada no se edita: "Editar inventário" abre la
 * versión siguiente copiando esta (RF-27). Es un formulario, no un enlace: abrir una versión escribe en la base.
 */
export function InventorySubmitted({ lang, t, orderId, version, submittedAt, detailHref }: Props) {
  const s = t.submitted;

  return (
    <section
      aria-labelledby="inventory-submitted"
      className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-surface px-6 py-8"
    >
      <h1 id="inventory-submitted" className="font-display text-[28px] font-extrabold">
        {interpolate(s.title, { version, when: formatDateTime(submittedAt) })}
      </h1>
      <p className="max-w-140 text-[15px] text-muted">{s.text}</p>
      <div className="mt-2 flex flex-wrap gap-2.5">
        <form action={openInventoryDraftAction}>
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="orderId" value={orderId} />
          <button type="submit" className={`${button} bg-primary text-primary-foreground shadow-md`}>
            {s.edit}
          </button>
        </form>
        <Link href={detailHref} className={`${button} border border-field-border bg-surface`}>
          {s.back}
        </Link>
      </div>
    </section>
  );
}
