// Entidades del equipo (RF-xx de personas). Fechas ISO (aaaa-mm-dd), horas hh:mm de Lisboa, teléfono normalizado (+351…).

export const POSITIONS = ["driver", "loader", "foreman"] as const;
/** Función dentro de la empresa. Es un código: el texto sale del diccionario. */
export type Position = (typeof POSITIONS)[number];

export const INACTIVE_REASONS = ["left", "other"] as const;
export type InactiveReason = (typeof INACTIVE_REASONS)[number];

export type InviteChannel = "email" | "link";

/** Estado en directo de un operario activo. `until` y `returnedAt` son horas hh:mm. */
export type LiveStatus =
  | { kind: "busy"; until: string; orderId: string }
  | { kind: "free"; returnedAt?: string; orderId?: string; dayOff?: boolean };

export type MemberJob = {
  orderId: string;
  client: string;
  /** Día del trabajo, aaaa-mm-dd. */
  date: string;
  start: string;
  end: string;
  /** Nombre del vehículo asignado, texto libre de la empresa. */
  vehicle: string;
};

export type MemberChange =
  | { kind: "accepted"; withoutPhone: boolean }
  | { kind: "position-changed"; from: Position; to: Position }
  | { kind: "deactivated"; reason: InactiveReason };

export type InviteChange = { kind: "invite-sent"; channel: InviteChannel } | { kind: "invite-link-copied" };

/** Una entrada del histórico: qué cambió, cuándo (aaaa-mm-dd) y quién (vacío si fue la propia persona). */
export type TeamEvent = { at: string; by?: string } & (MemberChange | InviteChange);

/** Momento de un acceso a la app. */
export type Access = { date: string; time: string };

export type Member = {
  kind: "member";
  id: string;
  name: string;
  position: Position;
  /** Teléfono normalizado (+351…); `null` si falta. */
  phone: string | null;
  email: string;
  active: boolean;
  /** Presente solo en operarios inactivos. */
  inactive?: { reason: InactiveReason; since: string; by: string };
  live: LiveStatus;
  /** Último día en que trabajó, aaaa-mm-dd. */
  lastWorkOn: string;
  /** Trabajos marcados (hoy y siguientes), por orden de fecha. */
  jobs: MemberJob[];
  /** Horas ocupadas por día, empezando hoy (7 valores). */
  weekHours: number[];
  /** Últimos 30 días: trabajos con la persona asignada, horas reales e incidencias. */
  stats30d: { jobs: number; hours: number; incidents: number };
  lastAccess: Access | null;
  /** Del más reciente al más antiguo. */
  history: TeamEvent[];
};

export type Invite = {
  kind: "invite";
  id: string;
  name: string;
  position: Position;
  phone: string | null;
  email: string;
  channel: InviteChannel;
  /** Día de envío y de caducidad, aaaa-mm-dd. */
  sentOn: string;
  expiresOn: string;
  history: TeamEvent[];
};

export type Person = Member | Invite;

export type Admin = {
  id: string;
  name: string;
  email: string;
  /** La persona que está viendo la pantalla. */
  you: boolean;
  lastAccess: Access | null;
};

export type TeamMetrics = {
  /** Mudança con menos personas asignadas de las que la proposta cuenta. */
  understaffed: { orderId: string; date: string; needed: number } | null;
};

export type TeamOverview = { people: Person[]; admins: Admin[]; metrics: TeamMetrics };
