import { Icon, type IconName } from "@/app/components/app-icon";
import { inputClass } from "@/app/components/form/field";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDate } from "@/app/lib/format";
import { firstName } from "@/features/orders/domain/client-name";
import type { Order } from "@/features/orders/domain/types";
import { buildMessage, type OrdersText } from "../orders-text";

type Props = {
  lang: Locale;
  t: OrdersText;
  order: Order;
  sender: string;
  company: string;
};

const actionBase =
  "flex h-12 items-center gap-2 rounded-xl px-4.5 text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-60";
const secondary = `${actionBase} border border-field-border bg-surface text-foreground`;

// TODO: generar el enlace con token (RF-15, RNF-02) y enviarlo (RF-16) está pendiente: hace falta la Edge Function
// y las tablas de solicitudes. Por ahora los botones solo muestran el diseño y están desactivados.
const SEND_BUTTONS: readonly { key: "sms" | "email"; icon: IconName }[] = [
  { key: "sms", icon: "smartphone" },
  { key: "email", icon: "mail" },
];

export function ShareLinkCard({ t, order, sender, company }: Props) {
  const c = t.created;
  const name = firstName(order.clientName);
  const days = order.linkValidityDays ?? 0;
  const message = buildMessage(t.message, { name, sender, company, link: t.message.linkPlaceholder, days }).join("\n");

  return (
    <section aria-labelledby="share" className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-7">
      <div className="flex flex-col gap-1">
        <h2 id="share" className="font-display text-2xl font-extrabold">
          {interpolate(c.shareTitle, { name })}
        </h2>
        <p className="text-[15px] text-muted">{interpolate(c.shareText, { name })}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="link" className="text-sm font-bold">
          {c.linkLabel}
        </label>
        <div className="flex flex-wrap gap-2.5">
          <input
            id="link"
            readOnly
            value={t.message.linkPlaceholder}
            aria-describedby="link-note link-pending"
            className={`${inputClass} flex-[1_1_280px] bg-surface-head text-[15px]`}
          />
          <button type="button" disabled className={secondary}>
            <Icon name="copy" size={18} />
            {c.copy}
          </button>
        </div>
        {order.linkValidUntil ? (
          <span id="link-note" className="text-xs text-muted">
            {interpolate(c.validUntil, { date: formatDate(order.linkValidUntil) })}
          </span>
        ) : null}
        <span id="link-pending" className="text-xs font-bold text-warn-foreground">
          {c.pending}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-bold">
          {c.messageLabel}
        </label>
        <textarea
          id="message"
          rows={5}
          defaultValue={message}
          className="rounded-xl border border-field-border bg-surface p-3.5 text-[15px] leading-[1.55] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button type="button" disabled className={`${actionBase} gap-2.5 bg-primary px-5.5 text-base text-primary-foreground`}>
          <Icon name="message" size={18} />
          {c.whatsapp}
        </button>
        {SEND_BUTTONS.map((button) => (
          <button key={button.key} type="button" disabled className={secondary}>
            <Icon name={button.icon} size={18} />
            {c[button.key]}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-surface-head px-4 py-3.5 text-sm">
        <Icon name="info" size={18} className="mt-px flex-none" />
        <span>
          {c.notice.before}
          <strong>{c.notice.status}</strong>
          {interpolate(c.notice.after, { name })}
        </span>
      </div>
    </section>
  );
}
