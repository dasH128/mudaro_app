import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDayMonth, formatEuroWhole, formatMonthName } from "@/app/lib/format";
import { daysBetween } from "@/features/fleet/domain/fleet";
import type { Client, ClientOrder, ClientSummary } from "../domain/types";

export type ClientsText = Dictionary["app"]["clients"];

/** Línea de detalle de la fila: "MD-0838 · amanhã 08:00". */
export function describeSummary(summary: ClientSummary, t: ClientsText, locale: Locale, today: string): string {
  const l = t.line;
  const { orderId } = summary;
  switch (summary.kind) {
    case "in-progress":
      return interpolate(summary.quoteExpiring ? l.inProgressQuote : l.inProgress, { orderId });
    case "today-draft":
      return interpolate(l.todayDraft, { orderId });
    case "inventory-arrived":
      return interpolate(l.inventoryArrived, { orderId, hours: summary.hoursAgo });
    case "missing-measure":
      return pluralize(locale, summary.objects, l.missingMeasure, { orderId });
    case "link-expires":
      return interpolate(l.linkExpires, { orderId });
    case "no-news":
      return pluralize(locale, summary.days, l.noNews, { orderId });
    case "share-link":
      return interpolate(l.shareLink, { orderId });
    case "scheduled": {
      const date = formatDayMonth(summary.on);
      if (summary.noResources) return interpolate(l.noResources, { orderId, date });
      return daysBetween(today, summary.on) === 1
        ? interpolate(l.scheduledTomorrow, { orderId, time: summary.time })
        : interpolate(l.scheduledDate, { orderId, date, time: summary.time });
    }
    case "delivered":
      return interpolate(l.delivered, { orderId, date: formatDayMonth(summary.on) });
    case "closed":
      return interpolate(l.closed, { orderId, date: formatDayMonth(summary.on) });
    case "lost":
      return interpolate(l.lost, { orderId, reason: summary.reason });
  }
}

export type DateText = { title: string; sub: string };

/** "Hoje · enviou o inventário", "24/10 · há 6 dias". */
export function describeLastContact(client: Client, t: ClientsText, locale: Locale, today: string): DateText {
  const { on, event } = client.lastContact;
  const days = Math.max(daysBetween(on, today), 0);
  const title = days === 0 ? t.contact.today : days === 1 ? t.contact.yesterday : formatDayMonth(on);
  return { title, sub: event ? t.contact.events[event] : pluralize(locale, days, t.contact.daysAgo) };
}

/** Nota de un pedido del panel: "Em curso · Furgão V-02 · André e Tiago". */
export function describeOrderNote(order: ClientOrder, client: Client, t: ClientsText, locale: Locale, today: string): string {
  const n = t.panel.orders.notes;
  const { note } = order;
  switch (note.kind) {
    case "quote-sent":
      return pluralize(locale, note.expiresInDays, n.quoteSent, { version: note.version });
    case "in-progress":
      return interpolate(n.inProgress, {
        vehicle: note.vehicle,
        crew: new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(note.crew),
      });
    case "closed":
      return interpolate(n.closed, { amount: formatEuroWhole(note.amountCents) });
    case "draft":
      return interpolate(n.draft, { time: note.since });
    case "short-staffed": {
      const when = daysBetween(today, order.moveOn) === 1 ? t.tomorrow : formatDayMonth(order.moveOn);
      return pluralize(locale, note.missing, n.shortStaffed, { when: `${when} ${note.time}` });
    }
    case "other-file":
      return interpolate(n.otherFile, { file: note.fileName });
    case "scheduled":
      return interpolate(n.scheduled, { vehicle: note.vehicle, start: note.start, end: note.end });
    case "last-contact":
      return interpolate(n.lastContact, { what: describeLastContact(client, t, locale, today).sub });
  }
}

/** "cliente desde set 2026" lo monta el panel; aquí, la fecha completa de un pedido perdido: "agosto". */
export function lostMonth(on: string, locale: Locale): string {
  return formatMonthName(locale, on).toLowerCase();
}

