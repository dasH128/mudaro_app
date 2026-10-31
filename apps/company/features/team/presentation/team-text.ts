import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDate, formatDayMonth } from "@/app/lib/format";
import { daysBetween } from "@/features/fleet/domain/fleet";
import { daysSinceLastWork, daysToExpire, nextJob, stateOf, type PersonState } from "../domain/team";
import type { Access, Invite, Member, Person, Position, TeamEvent } from "../domain/types";

export type TeamText = Dictionary["app"]["team"];

export const positionLabel = (position: Position, t: TeamText): string => t.positions[position];

/** "Carregador" o "Carregador · convidado por email". */
export function describeRole(person: Person, t: TeamText): string {
  const position = positionLabel(person.position, t);
  if (person.kind === "member") return position;
  return interpolate(person.channel === "email" ? t.invites.byEmail : t.invites.byLink, { position });
}

/** "hoje, 07:42", "ontem, 21:04", "há 12 dias". */
export function describeAccess(access: Access | null, t: TeamText, locale: Locale, today: string): string {
  if (!access) return t.access.never;
  const days = Math.max(daysBetween(access.date, today), 0);
  if (days === 0) return interpolate(t.access.today, { time: access.time });
  if (days === 1) return interpolate(t.access.yesterday, { time: access.time });
  return pluralize(locale, days, t.access.daysAgo);
}

/** "hoje, 31/10", "amanhã, 31/10" o solo "03/11". */
export function describeExpiry(invite: Invite, t: TeamText, today: string): string {
  const days = daysToExpire(invite, today);
  const date = formatDayMonth(invite.expiresOn);
  if (days === 0) return interpolate(t.invites.today, { date });
  if (days === 1) return interpolate(t.invites.tomorrow, { date });
  return date;
}

/** "enviado 24/10 · expira amanhã, 31/10". */
export function describeInviteTimes(invite: Invite, t: TeamText, today: string): { sent: string; expires: string } {
  return { sent: formatDayMonth(invite.sentOn), expires: describeExpiry(invite, t, today) };
}

/** Motivo y "desde 15/10 · Gema" de un operario inactivo. */
export function describeInactive(member: Member, t: TeamText): { reason: string; since: string } {
  const inactive = member.inactive;
  if (!inactive) return { reason: t.status.inactive, since: "" };
  return {
    reason: t.inactiveReasons[inactive.reason],
    since: interpolate(t.since, { date: formatDayMonth(inactive.since), by: inactive.by }),
  };
}

export type StatusText = { state: PersonState; label: string; note: string };

/** Pasa el estado de la persona a los textos: etiqueta de la insignia y la línea de detalle. */
export function describeStatus(person: Person, t: TeamText, today: string): StatusText {
  const state = stateOf(person);
  const label = t.status[state];

  if (person.kind === "invite") {
    const { sent, expires } = describeInviteTimes(person, t, today);
    return { state, label, note: interpolate(t.invites.sentExpires, { sent, expires }) };
  }
  if (!person.active) {
    const { reason, since } = describeInactive(person, t);
    return { state, label, note: since ? `${reason} · ${since}` : t.inactiveNote };
  }
  const { live } = person;
  if (live.kind === "busy") return { state, label, note: interpolate(t.live.busyUntil, { time: live.until, orderId: live.orderId }) };
  if (live.returnedAt) {
    const template = live.orderId ? t.live.returnedOrder : t.live.returned;
    return { state, label, note: interpolate(template, { time: live.returnedAt, orderId: live.orderId ?? "" }) };
  }
  return { state, label, note: live.dayOff ? t.live.dayOff : t.live.noJobsToday };
}

export type DateText = { title: string; sub: string };

/** "Hoje · MD-0821", "28/10 · há 2 dias". */
export function describeLastWork(member: Member, t: TeamText, locale: Locale, today: string): DateText {
  const days = daysSinceLastWork(member, today);
  if (days === 0) {
    const { live } = member;
    const sub =
      live.kind === "busy"
        ? live.orderId
        : live.returnedAt
          ? interpolate(t.lastWork.until, { time: live.returnedAt })
          : "";
    return { title: t.lastWork.today, sub };
  }
  return { title: formatDayMonth(member.lastWorkOn), sub: pluralize(locale, days, t.lastWork.daysAgo) };
}

/** "31/10 · 09:00" y "MD-0840 · Luís Pereira"; sin trabajos, "Sem data". */
export function describeNextWork(member: Member, t: TeamText, today: string): DateText {
  if (!member.active) return { title: "—", sub: "" };
  const job = nextJob(member, today);
  if (!job) return { title: t.nextWork.none, sub: t.nextWork.nothing };
  return { title: `${formatDayMonth(job.date)} · ${job.start}`, sub: `${job.orderId} · ${job.client}` };
}

/** Título de cada entrada del histórico de la persona. */
export function describeEvent(event: TeamEvent, t: TeamText): { title: string; meta: string } {
  const h = t.panel.history;
  const meta = event.by ? `${formatDate(event.at)} · ${event.by}` : formatDate(event.at);
  switch (event.kind) {
    case "accepted":
      return { title: event.withoutPhone ? h.acceptedNoPhone : h.accepted, meta };
    case "position-changed":
      return {
        title: interpolate(h.positionChanged, {
          from: positionLabel(event.from, t).toLowerCase(),
          to: positionLabel(event.to, t).toLowerCase(),
        }),
        meta,
      };
    case "deactivated":
      return { title: interpolate(h.deactivated, { reason: t.inactiveReasons[event.reason].toLowerCase() }), meta };
    case "invite-sent":
      return { title: event.channel === "email" ? h.inviteSentEmail : h.inviteSentLink, meta };
    case "invite-link-copied":
      return { title: h.inviteLinkCopied, meta };
  }
}
