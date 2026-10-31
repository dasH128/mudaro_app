import { daysBetween } from "@/features/fleet/domain/fleet";
import type { Invite, Member, MemberJob, Person, TeamMetrics } from "./types";

// Reglas de la lista del equipo: estado, filtros, orden y avisos. Lógica pura, sin React ni Next.

export const FILTERS = ["all", "busy", "free", "invites"] as const;
export type TeamFilter = (typeof FILTERS)[number];
export const DEFAULT_FILTER: TeamFilter = "all";

export const SORTS = ["status", "name", "nextJob", "jobs30"] as const;
export type TeamSort = (typeof SORTS)[number];
export const DEFAULT_SORT: TeamSort = "status";

export const VIEWS = ["list", "cards"] as const;
export type TeamView = (typeof VIEWS)[number];
export const DEFAULT_VIEW: TeamView = "list";

/** Un operario activo sin trabajar tantos días se marca como parado (provisional). */
export const IDLE_DAYS = 14;
/** Un convite que caduca en este número de días o menos se avisa como urgente (provisional). */
export const INVITE_URGENT_DAYS = 1;

export const isFilter = (value: string | undefined): value is TeamFilter => FILTERS.some((f) => f === value);
export const isSort = (value: string | undefined): value is TeamSort => SORTS.some((s) => s === value);
export const isView = (value: string | undefined): value is TeamView => VIEWS.some((v) => v === value);

export type PersonState = "busy" | "free" | "invite" | "inactive";

export function stateOf(person: Person): PersonState {
  if (person.kind === "invite") return "invite";
  return person.active ? person.live.kind : "inactive";
}

export const isMember = (person: Person): person is Member => person.kind === "member";
export const isInvite = (person: Person): person is Invite => person.kind === "invite";

export function daysSinceLastWork(member: Member, today: string): number {
  return Math.max(daysBetween(member.lastWorkOn, today), 0);
}

export function isIdle(member: Member, today: string): boolean {
  return member.active && daysSinceLastWork(member, today) >= IDLE_DAYS;
}

/** Primer trabajo marcado después de hoy. */
export function nextJob(member: Member, today: string): MemberJob | undefined {
  return member.jobs.find((job) => job.date > today);
}

/** Sin teléfono, el equipo no puede localizar a la persona el día de la mudança. */
export const lacksPhone = (member: Member): boolean => member.active && member.phone === null;

/** Días hasta que caduca el convite (0 = hoy). */
export function daysToExpire(invite: Invite, today: string): number {
  return daysBetween(today, invite.expiresOn);
}

export type TeamSummary = { active: number; busy: number; free: number; invites: number; inactive: number };

export function summarize(people: readonly Person[]): TeamSummary {
  const members = people.filter(isMember);
  const active = members.filter((m) => m.active);
  return {
    active: active.length,
    busy: active.filter((m) => m.live.kind === "busy").length,
    free: active.filter((m) => m.live.kind === "free").length,
    invites: people.filter(isInvite).length,
    inactive: members.length - active.length,
  };
}

export function countByFilter(people: readonly Person[]): Record<TeamFilter, number> {
  const s = summarize(people);
  return { all: s.active + s.invites, busy: s.busy, free: s.free, invites: s.invites };
}

/** Minúsculas y sin tildes, espacios ni guiones, para buscar por nombre, email o teléfono ("912345"). */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s-]/g, "")
    .toLowerCase();
}

function matches(person: Person, filter: TeamFilter): boolean {
  if (filter === "busy") return stateOf(person) === "busy";
  if (filter === "free") return stateOf(person) === "free";
  if (filter === "invites") return person.kind === "invite";
  return true;
}

const STATE_ORDER: Record<PersonState, number> = { busy: 0, free: 1, invite: 2, inactive: 3 };

function compare(sort: TeamSort, today: string): (a: Person, b: Person) => number {
  // Sin próximo trabajo (y los convites), al final
  const nextOf = (p: Person) => {
    const job = isMember(p) ? nextJob(p, today) : undefined;
    return job ? `${job.date}T${job.start}` : "9999";
  };
  const jobsOf = (p: Person) => (isMember(p) ? p.stats30d.jobs : -1);
  switch (sort) {
    case "status":
      return (a, b) => STATE_ORDER[stateOf(a)] - STATE_ORDER[stateOf(b)];
    case "name":
      return (a, b) => a.name.localeCompare(b.name, "pt");
    case "nextJob":
      return (a, b) => nextOf(a).localeCompare(nextOf(b));
    case "jobs30":
      return (a, b) => jobsOf(b) - jobsOf(a);
  }
}

export type TeamQuery = { filter: TeamFilter; q: string; sort: TeamSort };

/**
 * Activos y convites filtrados y ordenados, y aparte los inactivos (siempre visibles, solo les afecta la búsqueda).
 * `all` es el orden de navegación del panel: activos y convites, y después inactivos.
 */
export function arrangeTeam(people: readonly Person[], { filter, q, sort }: TeamQuery, today: string) {
  const needle = normalize(q);
  const found = (p: Person) => needle === "" || normalize(`${p.name}${p.email}${p.phone ?? ""}`).includes(needle);
  const order = compare(sort, today);

  const active = people.filter((p) => stateOf(p) !== "inactive" && found(p) && matches(p, filter)).sort(order);
  const inactive = people.filter((p) => stateOf(p) === "inactive" && found(p)).sort(order);
  return { active, inactive, all: [...active, ...inactive] };
}

export type TeamAlerts = {
  understaffed: { orderId: string; date: string; needed: number; assigned: number; free: Member[] } | null;
  /** El convite que caduca primero, si es urgente. */
  expiringInvite: { invite: Invite; sentDaysAgo: number } | null;
  /** El primer operario activo sin teléfono. */
  missingPhone: Member | null;
};

export function teamAlerts(people: readonly Person[], metrics: TeamMetrics, today: string): TeamAlerts {
  const active = people.filter(isMember).filter((m) => m.active);

  const staffing = metrics.understaffed;
  const assigned = staffing
    ? active.filter((m) => m.jobs.some((j) => j.orderId === staffing.orderId && j.date === staffing.date)).length
    : 0;
  const busyThatDay = (m: Member, date: string) => m.jobs.some((j) => j.date === date);
  const understaffed =
    staffing && assigned < staffing.needed
      ? { ...staffing, assigned, free: active.filter((m) => !busyThatDay(m, staffing.date)) }
      : null;

  const invite = people
    .filter(isInvite)
    .filter((i) => daysToExpire(i, today) <= INVITE_URGENT_DAYS)
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))[0];

  return {
    understaffed,
    expiringInvite: invite ? { invite, sentDaysAgo: daysBetween(invite.sentOn, today) } : null,
    missingPhone: active.find(lacksPhone) ?? null,
  };
}
