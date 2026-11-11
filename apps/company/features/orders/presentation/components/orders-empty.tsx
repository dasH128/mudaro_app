import { FirstUse } from "@/app/components/first-use";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { OrdersListText } from "../orders-text";
import { OrdersEmptyArt, PerkIcon } from "./orders-empty-art";

type Props = { lang: Locale; t: OrdersListText };

const PERKS = ["client", "inventory", "quote"] as const;

/** Primer uso: la empresa aún no tiene ningún pedido. */
export function OrdersEmpty({ lang, t }: Props) {
  const e = t.empty;

  return (
    <FirstUse
      header={{ eyebrow: t.eyebrow, title: t.title, icon: "orders", count: e.count }}
      hero={{
        eyebrow: e.eyebrow,
        title: e.title,
        text: e.text,
        cta: e.cta,
        ctaIcon: "plus",
        ctaHref: localePath(lang, ROUTES.orders.new),
        hint: e.hint,
        soon: t.soon,
        art: <OrdersEmptyArt />,
      }}
      perks={{
        title: e.perksTitle,
        items: PERKS.map((key) => ({ icon: <PerkIcon name={key} />, title: e.perks[key].title, text: e.perks[key].text })),
      }}
      footer={{ note: e.later, aside: null }}
    />
  );
}
