// Entidades del panel "Operações de hoje". TypeScript puro: sin React, Next ni Supabase.

export type JobStatus = "in-progress" | "scheduled" | "done" | "unassigned";

export type Job = {
  id: string;
  client: string;
  kind: string;
  from: string;
  to: string;
  volume: string;
  status: JobStatus;
  statusLabel: string;
  vehicle: string;
  crew: string;
  time: string;
};

export type Tone = "neutral" | "warn" | "success" | "danger";

/** Qué mide cada tarjeta. La interfaz decide el icono. */
export type StatKind = "jobs-today" | "in-progress" | "incidents";

export type Stat = {
  kind: StatKind;
  label: string;
  value: string;
  tone: Exclude<Tone, "neutral">;
  hint: string;
  delta?: string;
};

export type Stage = {
  label: string;
  count: string;
  hint: string;
  tone: Exclude<Tone, "danger">;
};

export type ActivityTone = "primary" | "ink" | "success" | "danger";

export type ActivityItem = {
  time: string;
  tone: ActivityTone;
  ref: string;
  text: string;
  sub: string;
};

export type Dashboard = {
  stats: readonly Stat[];
  jobs: readonly Job[];
  stages: readonly Stage[];
  activity: readonly ActivityItem[];
};
