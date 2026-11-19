"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Icon, type IconName } from "@/app/components/app-icon";
import { inputClass } from "@/app/components/form/field";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDate } from "@/app/lib/format";
import { shareLinkAction } from "@/features/orders/application/actions/share-link";
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
  "flex h-12 items-center gap-2 rounded-xl px-4.5 text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-60 disabled:cursor-not-allowed disabled:opacity-60";
const secondary = `${actionBase} border border-field-border bg-surface text-foreground`;
const primary = `${actionBase} gap-2.5 bg-primary px-5.5 text-base text-primary-foreground`;

/** Enlaces que abren la app del propio dispositivo con el mensaje ya escrito. El envío automático (RF-16) llegará después. */
function channelHref(channel: "whatsapp" | "sms" | "email", message: string, phone: string | null, email: string | null, subject: string) {
  const text = encodeURIComponent(message);
  switch (channel) {
    case "whatsapp":
      return phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}` : null;
    case "sms":
      return phone ? `sms:${phone}?&body=${text}` : null;
    case "email":
      return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${text}` : null;
  }
}

const CHANNELS: readonly { key: "sms" | "email"; icon: IconName }[] = [
  { key: "sms", icon: "smartphone" },
  { key: "email", icon: "mail" },
];

// RF-15: el enlace solo se ve al generarlo; la base guarda su hash (RNF-02). Por eso se genera al pulsar el botón, no
// al cargar la página, y volver a generarlo anula el anterior (con confirmación).
export function ShareLinkCard({ lang, t, order, sender, company }: Props) {
  const c = t.created;
  const router = useRouter();
  const name = firstName(order.clientName);
  const days = order.linkValidityDays ?? 0;
  const draftMessage = (link: string) => buildMessage(t.message, { name, sender, company, link, days }).join("\n");

  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState<string | null>(order.linkShared ? order.linkValidUntil : null);
  const [message, setMessage] = useState(() => draftMessage(t.message.linkPlaceholder));
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const alreadyShared = order.linkShared || link !== null;

  const generate = () => {
    setConfirming(false);
    setFailed(false);
    startTransition(async () => {
      const result = await shareLinkAction({ lang, orderId: order.id });
      if (!result.ok) {
        setFailed(true);
        return;
      }
      setLink(result.url);
      setValidUntil(result.validUntil);
      setMessage(draftMessage(result.url));
      setCopied(false);
      // El estado del pedido cambió en la base: refresca la línea de estado de la página.
      router.refresh();
    });
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const href = (channel: "whatsapp" | "sms" | "email") =>
    link ? channelHref(channel, message, order.clientPhone, order.clientEmail, c.emailSubject) : null;

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
            value={link ?? (alreadyShared ? c.linkHidden : t.message.linkPlaceholder)}
            aria-describedby="link-note"
            className={`${inputClass} flex-[1_1_280px] bg-surface-head text-[15px]`}
          />
          {link ? (
            <button type="button" onClick={copy} className={secondary}>
              <Icon name={copied ? "check" : "copy"} size={18} />
              {copied ? c.copied : c.copy}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={alreadyShared ? () => setConfirming(true) : generate}
              className={alreadyShared ? secondary : primary}
            >
              <Icon name="link" size={18} />
              {pending ? c.generating : alreadyShared ? c.regenerate : c.generate}
            </button>
          )}
        </div>
        <span id="link-note" className="text-xs text-muted">
          {validUntil ? interpolate(c.validUntil, { date: formatDate(validUntil) }) : null}
          {validUntil && !link && alreadyShared ? " · " : null}
          {!link && alreadyShared ? c.hiddenNote : null}
        </span>
        {link ? (
          <span role="status" className="text-xs font-bold text-success-foreground">
            {c.generated}
          </span>
        ) : null}
        {failed ? (
          <span role="alert" className="text-xs font-bold text-danger-foreground">
            {c.error}
          </span>
        ) : null}
      </div>

      {confirming ? (
        <div role="alertdialog" aria-labelledby="regenerate-title" className="flex flex-wrap items-center gap-3 rounded-xl border border-danger-border bg-danger-surface px-4 py-3.5">
          <span id="regenerate-title" className="flex-[1_1_240px] text-sm font-bold text-danger-foreground">
            {c.regenerateWarning}
          </span>
          <button type="button" onClick={() => setConfirming(false)} className="h-9 px-3 text-sm font-bold underline">
            {c.cancel}
          </button>
          <button type="button" onClick={generate} className="h-9 rounded-[10px] bg-foreground px-3.5 text-[13px] font-bold text-background">
            {c.regenerateConfirm}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-bold">
          {c.messageLabel}
        </label>
        <textarea
          id="message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="rounded-xl border border-field-border bg-surface p-3.5 text-[15px] leading-[1.55] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <ChannelLink href={href("whatsapp")} className={primary} icon="message" label={c.whatsapp} hint={link ? c.noPhone : c.generateFirst} />
        {CHANNELS.map((channel) => (
          <ChannelLink
            key={channel.key}
            href={href(channel.key)}
            className={secondary}
            icon={channel.icon}
            label={c[channel.key]}
            hint={link ? (channel.key === "email" ? c.noEmail : c.noPhone) : c.generateFirst}
          />
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

/** Botón de canal: enlace activo cuando hay enlace del pedido y contacto; si no, desactivado con el motivo. */
function ChannelLink({ href, className, icon, label, hint }: { href: string | null; className: string; icon: IconName; label: string; hint: string }) {
  if (!href) {
    return (
      <span role="link" aria-disabled="true" title={hint} className={className}>
        <Icon name={icon} size={18} />
        {label}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      <Icon name={icon} size={18} />
      {label}
    </a>
  );
}
