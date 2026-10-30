import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { dayLisbon, formatDate, formatMonthName, formatRelativeTime, formatTime, formatVolume } from "@/app/lib/format";
import { daysBetween } from "@/features/proposals/domain/status";
import type { OrderListItem, OrderNote } from "../domain/types";

export type OrdersText = Dictionary["app"]["orders"];
export type NewOrderText = OrdersText["new"];
export type CreatedText = OrdersText["created"];
export type OrdersListText = OrdersText["list"];
export type OrderDetailText = OrdersText["detail"];

type MessageValues = { name: string; sender: string; company: string; link: string; days: number };

/** Mensaje al cliente, párrafo a párrafo. Se usa en la vista previa y en el texto que se envía. */
export function buildMessage(t: OrdersText["message"], values: MessageValues): string[] {
  return t.body.map((paragraph) => interpolate(paragraph, values));
}

/** Pasa la nota del dominio al texto de la lista. */
export function describeNote(note: OrderNote, t: OrdersListText, locale: Locale, today: string): string {
  const n = t.notes;
  switch (note.kind) {
    case "inventory-ready":
      return interpolate(n.inventoryReady, {
        time: formatRelativeTime(locale, note.receivedAt),
        items: note.items,
        volume: formatVolume(note.volumeM3),
      });
    case "inventory-missing-measures":
      return pluralize(locale, note.missing, n.missingMeasures, { time: formatRelativeTime(locale, note.receivedAt) });
    case "draft-proposal":
      return interpolate(n.draftProposal, { time: formatRelativeTime(locale, note.savedAt) });
    case "link-expiring": {
      const days = daysBetween(today, note.validUntil);
      if (days < 0) return n.linkExpired;
      return days === 0 ? n.linkExpiresToday : pluralize(locale, days, n.linkExpiresIn);
    }
    case "no-news":
      return pluralize(locale, note.days, n.noNews);
    case "just-created":
      return n.justCreated;
    case "just-created-self":
      return n.justCreatedSelf;
    case "filling":
      return interpolate(n.filling, { date: formatDate(note.validUntil) });
    case "proposal-sent": {
      const days = daysBetween(today, note.validUntil);
      if (days < 0) return interpolate(n.proposalExpired, { version: note.version });
      return days === 0
        ? interpolate(n.proposalSentToday, { version: note.version })
        : pluralize(locale, days, n.proposalSent, { version: note.version });
    }
    case "won":
      return dayLisbon(note.signedAt) === today
        ? interpolate(n.wonToday, { time: formatTime(note.signedAt) })
        : interpolate(n.wonOn, { date: formatDate(note.signedAt) });
    case "lost":
      return note.reason ? interpolate(n.lostReason, { reason: note.reason }) : n.lostNoReason;
  }
}

/** Fecha de la mudança y cuánto falta. Con margen amplio (mes o semana) se dice el margen en vez de la cuenta atrás. */
export function describeWhen(item: Pick<OrderListItem, "date" | "flexibility" | "stage">, t: OrdersListText, locale: Locale, today: string) {
  const w = t.when;
  const date = item.flexibility === "month" ? formatMonthName(locale, item.date) : formatDate(item.date);

  if (item.stage === "lost") return { date, countdown: w.notProceeded };
  if (item.flexibility === "month") return { date, countdown: w.monthOnly };
  if (item.flexibility === "two-days") return { date, countdown: w.twoDays };
  if (item.flexibility === "one-week") return { date, countdown: w.oneWeek };

  const days = daysBetween(today, item.date);
  if (days === 0) return { date, countdown: w.today };
  return { date, countdown: days > 0 ? pluralize(locale, days, w.inDays) : pluralize(locale, -days, w.daysAgo) };
}
