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
  /** Alta desde el panel (persona sin cuenta, paso 6.0b). */
  | { kind: "added"; withoutPhone: boolean }
  | { kind: "accepted"; withoutPhone: boolean }
  | { kind: "renamed"; from: string; to: string }
  /** Teléfonos normalizados (+351…); `null` si no había o se borró. */
  | { kind: "phone-changed"; from: string | null; to: string | null }
  | { kind: "position-changed"; from: Position; to: Position }
  | { kind: "deactivated"; reason: InactiveReason }
  | { kind: "reactivated" };

export type InviteChange = { kind: "invite-sent"; channel: InviteChannel } | { kind: "invite-link-copied" };

/** Una entrada del histórico: qué cambió, cuándo (aaaa-mm-dd) y quién (vacío si fue la propia persona). `id` es único. */
export type TeamEvent = { id: string; at: string; by?: string } & (MemberChange | InviteChange);

/** Momento de un acceso a la app. */
export type Access = { date: string; time: string };

export type Member = {
  kind: "member";
  id: string;
  name: string;
  position: Position;
  /** Teléfono normalizado (+351…); `null` si falta. */
  phone: string | null;
  /** Solo con cuenta en la app; las personas sin cuenta (MVP) no tienen. */
  email: string | null;
  active: boolean;
  /** Presente solo en operarios inactivos. */
  inactive?: { reason: InactiveReason; since: string; by: string };
  live: LiveStatus;
  /** Último día en que trabajó, aaaa-mm-dd. `null` si todavía no ha trabajado. */
  lastWorkOn: string | null;
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
  /** `null`: el email vive en Supabase Auth y el panel no lo lee. */
  email: string | null;
  /** La persona que está viendo la pantalla. */
  you: boolean;
  lastAccess: Access | null;
};

/** Datos que se editan desde el panel de la persona (paso 6.0b). */
export type CrewData = { name: string; phone: string | null; position: Position };

export type TeamMetrics = {
  /** Mudança con menos personas asignadas de las que el presupuesto cuenta. */
  understaffed: { orderId: string; date: string; needed: number } | null;
};

export type TeamOverview = { people: Person[]; admins: Admin[]; metrics: TeamMetrics };
