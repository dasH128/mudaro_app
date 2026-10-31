import { addDays } from "@/features/fleet/domain/fleet";
import type { Admin, Invite, Member, MemberJob, Person, TeamEvent, TeamMetrics } from "../domain/types";

// Datos de ejemplo del equipo. Se sustituyen por consultas a Supabase.
// Las fechas son relativas a hoy para que "convite que expira amanhã" o "há 18 dias" no se desfasen con el tiempo.
// "Gema" y "Marta" son fijas: saldrán del usuario de la sesión. Los teléfonos y emails son inventados.

const GEMA = "Gema";

type JobSeed = Omit<MemberJob, "date"> & { inDays: number };
// Omit que respeta cada variante de la unión
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type EventSeed = { daysAgo: number } & DistributiveOmit<TeamEvent, "at">;
type AccessSeed = { daysAgo: number; time: string };

const JOBS = {
  m0821: { inDays: 0, start: "08:00", end: "16:00", orderId: "MD-0821", client: "Família Moreira", vehicle: "Camião grande" },
  m0824: { inDays: 0, start: "14:00", end: "18:00", orderId: "MD-0824", client: "TechHub Ibéria", vehicle: "Furgão V-02" },
  m0840: { inDays: 1, start: "09:00", end: "13:00", orderId: "MD-0840", client: "Luís Pereira", vehicle: "Camião grande" },
  m0838: { inDays: 1, start: "08:00", end: "14:00", orderId: "MD-0838", client: "Rita Gomes", vehicle: "Furgão V-01" },
  m0841: { inDays: 3, start: "08:30", end: "14:30", orderId: "MD-0841", client: "Nuno Teixeira", vehicle: "Furgão V-02" },
  m0827: { inDays: 4, start: "08:00", end: "15:00", orderId: "MD-0827", client: "Escritórios Delta", vehicle: "Camião grande" },
  m0844: { inDays: 5, start: "09:00", end: "13:00", orderId: "MD-0844", client: "Carlos Mota", vehicle: "Furgão V-01" },
  m0830: { inDays: 6, start: "08:00", end: "13:00", orderId: "MD-0830", client: "Carla Mendes", vehicle: "Camião médio" },
  m0843: { inDays: 6, start: "08:00", end: "13:00", orderId: "MD-0843", client: "Inês Rocha", vehicle: "Furgão V-02" },
} satisfies Record<string, JobSeed>;

type MemberSeed = Omit<Member, "kind" | "jobs" | "lastWorkOn" | "inactive" | "history" | "lastAccess" | "email"> & {
  jobs: JobSeed[];
  lastWorkDaysAgo: number;
  inactive?: { reason: "left" | "other"; sinceDaysAgo: number };
  history: EventSeed[];
  lastAccess: AccessSeed | null;
};

const MEMBERS: MemberSeed[] = [
  {
    id: "rui", name: "Rui Santos", position: "foreman", phone: "+351912345001", active: true,
    live: { kind: "busy", until: "16:00", orderId: "MD-0821" }, lastWorkDaysAgo: 0,
    jobs: [JOBS.m0821, JOBS.m0840, JOBS.m0827], weekHours: [8, 4, 0, 0, 7, 0, 0],
    stats30d: { jobs: 14, hours: 96, incidents: 1 }, lastAccess: { daysAgo: 0, time: "07:42" },
    history: [
      { daysAgo: 30, by: GEMA, kind: "position-changed", from: "loader", to: "foreman" },
      { daysAgo: 59, kind: "accepted", withoutPhone: false },
    ],
  },
  {
    id: "paulo", name: "Paulo Ferreira", position: "loader", phone: "+351912345002", active: true,
    live: { kind: "busy", until: "16:00", orderId: "MD-0821" }, lastWorkDaysAgo: 0,
    jobs: [JOBS.m0821, JOBS.m0840, JOBS.m0841], weekHours: [8, 4, 0, 6, 0, 0, 0],
    stats30d: { jobs: 12, hours: 81, incidents: 0 }, lastAccess: { daysAgo: 0, time: "07:55" },
    history: [{ daysAgo: 58, kind: "accepted", withoutPhone: false }],
  },
  {
    id: "andre", name: "André Lopes", position: "driver", phone: "+351912345003", active: true,
    live: { kind: "busy", until: "18:00", orderId: "MD-0824" }, lastWorkDaysAgo: 0,
    jobs: [JOBS.m0824, JOBS.m0841, JOBS.m0843], weekHours: [4, 0, 0, 6, 0, 0, 5],
    stats30d: { jobs: 11, hours: 70, incidents: 0 }, lastAccess: { daysAgo: 0, time: "13:30" },
    history: [{ daysAgo: 59, kind: "accepted", withoutPhone: false }],
  },
  {
    id: "tiago", name: "Tiago Marques", position: "loader", phone: "+351912345004", active: true,
    live: { kind: "busy", until: "18:00", orderId: "MD-0824" }, lastWorkDaysAgo: 0,
    jobs: [JOBS.m0824, JOBS.m0841, JOBS.m0844], weekHours: [4, 0, 0, 6, 0, 4, 0],
    stats30d: { jobs: 9, hours: 58, incidents: 2 }, lastAccess: { daysAgo: 0, time: "13:41" },
    history: [{ daysAgo: 51, kind: "accepted", withoutPhone: false }],
  },
  {
    id: "bruno", name: "Bruno Costa", position: "driver", phone: "+351912345005", active: true,
    live: { kind: "free", returnedAt: "11:15", orderId: "MD-0819" }, lastWorkDaysAgo: 0,
    jobs: [JOBS.m0838, JOBS.m0844], weekHours: [3, 6, 0, 0, 0, 4, 0],
    stats30d: { jobs: 10, hours: 62, incidents: 0 }, lastAccess: { daysAgo: 0, time: "11:20" },
    history: [{ daysAgo: 59, kind: "accepted", withoutPhone: false }],
  },
  {
    id: "marco", name: "Marco Ribeiro", position: "loader", phone: "+351912345006", active: true,
    live: { kind: "free", dayOff: true }, lastWorkDaysAgo: 2,
    jobs: [JOBS.m0838, JOBS.m0844, JOBS.m0830], weekHours: [0, 6, 0, 0, 0, 4, 5],
    stats30d: { jobs: 8, hours: 49, incidents: 0 }, lastAccess: { daysAgo: 1, time: "21:04" },
    history: [{ daysAgo: 45, kind: "accepted", withoutPhone: false }],
  },
  {
    id: "hugo", name: "Hugo Almeida", position: "loader", phone: null, active: true,
    live: { kind: "free" }, lastWorkDaysAgo: 18,
    jobs: [], weekHours: [0, 0, 0, 0, 0, 0, 0],
    stats30d: { jobs: 2, hours: 11, incidents: 0 }, lastAccess: { daysAgo: 12, time: "09:10" },
    history: [{ daysAgo: 40, kind: "accepted", withoutPhone: true }],
  },
  {
    id: "carlos", name: "Carlos Pinto", position: "driver", phone: "+351912345007", active: false,
    inactive: { reason: "left", sinceDaysAgo: 16 },
    live: { kind: "free" }, lastWorkDaysAgo: 17,
    jobs: [], weekHours: [0, 0, 0, 0, 0, 0, 0],
    stats30d: { jobs: 3, hours: 20, incidents: 0 }, lastAccess: { daysAgo: 17, time: "18:02" },
    history: [
      { daysAgo: 16, by: GEMA, kind: "deactivated", reason: "left" },
      { daysAgo: 59, kind: "accepted", withoutPhone: false },
    ],
  },
];

type InviteSeed = Omit<Invite, "kind" | "sentOn" | "expiresOn" | "email" | "history"> & {
  sentDaysAgo: number;
  expiresInDays: number;
  sentBy: string;
};

const INVITES: InviteSeed[] = [
  { id: "diogo", name: "Diogo Neves", position: "loader", phone: "+351912345008", channel: "email", sentDaysAgo: 6, expiresInDays: 1, sentBy: GEMA },
  { id: "sergio", name: "Sérgio Dias", position: "driver", phone: "+351912345009", channel: "link", sentDaysAgo: 3, expiresInDays: 4, sentBy: "Marta" },
];

/** "Rui Santos" → "rui.santos@exemplo.pt" (sin tildes). */
function exampleEmail(name: string): string {
  const slug = name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, ".");
  return `${slug}@exemplo.pt`;
}

function at(today: string, access: AccessSeed | null) {
  return access ? { date: addDays(today, -access.daysAgo), time: access.time } : null;
}

function events(today: string, seeds: EventSeed[]): TeamEvent[] {
  return seeds.map(({ daysAgo, ...event }) => ({ ...event, at: addDays(today, -daysAgo) }) as TeamEvent);
}

/** Personas de ejemplo (operarios y convites) con las fechas calculadas desde `today` (aaaa-mm-dd). */
export function mockPeople(today: string): Person[] {
  const members: Member[] = MEMBERS.map(({ lastWorkDaysAgo, jobs, inactive, history, lastAccess, ...member }) => ({
    ...member,
    kind: "member",
    email: exampleEmail(member.name),
    lastWorkOn: addDays(today, -lastWorkDaysAgo),
    jobs: jobs.map(({ inDays, ...job }) => ({ ...job, date: addDays(today, inDays) })),
    inactive: inactive ? { reason: inactive.reason, since: addDays(today, -inactive.sinceDaysAgo), by: GEMA } : undefined,
    lastAccess: at(today, lastAccess),
    history: events(today, history),
  }));

  const invites: Invite[] = INVITES.map(({ sentDaysAgo, expiresInDays, sentBy, ...invite }) => ({
    ...invite,
    kind: "invite",
    email: exampleEmail(invite.name),
    sentOn: addDays(today, -sentDaysAgo),
    expiresOn: addDays(today, expiresInDays),
    history: events(today, [
      { daysAgo: sentDaysAgo, by: sentBy, ...(invite.channel === "email" ? { kind: "invite-sent" as const, channel: "email" as const } : { kind: "invite-link-copied" as const }) },
    ]),
  }));

  return [...members, ...invites];
}

export function mockAdmins(today: string): Admin[] {
  return [
    { id: "gema", name: "Gema Henriques", email: exampleEmail("Gema Henriques"), you: true, lastAccess: at(today, { daysAgo: 0, time: "07:30" }) },
    { id: "marta", name: "Marta Silva", email: exampleEmail("Marta Silva"), you: false, lastAccess: at(today, { daysAgo: 1, time: "18:20" }) },
  ];
}

/** Amanhã a proposta do MD-0838 conta com 3 operários e só há 2 atribuídos. */
export function mockMetrics(today: string): TeamMetrics {
  return { understaffed: { orderId: "MD-0838", date: addDays(today, 1), needed: 3 } };
}
