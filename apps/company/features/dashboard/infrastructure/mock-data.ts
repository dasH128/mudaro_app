import type { ActivityItem, Attention, Job, Stage, Stat } from "../domain/types";

// Datos de ejemplo del prototipo "Operações de hoje". Se sustituyen por consultas a Supabase.

export const STATS: readonly Stat[] = [
  { kind: "jobs-today", value: 4, tone: "warn", delta: 1 },
  { kind: "in-progress", value: 2, tone: "success" },
  { kind: "incidents", value: 1, tone: "danger" },
];

export const ATTENTION: Attention = { incident: "#IC-004", jobId: "MD-0821", reason: "carga com medidas incorretas" };

export const JOBS: readonly Job[] = [
  { id: "MD-0821", client: "Família Moreira", kind: "full-move", typology: "T3", from: "Benfica", to: "Parque das Nações", volumeM3: 64, trips: 2, status: "in-progress", phase: "unloading", vehicle: "Camião 18 t · AA-12-BC", crewCount: 4, time: "15:45" },
  { id: "MD-0824", client: "TechHub Ibéria", kind: "office-transfer", typology: null, from: "Lisboa", to: "Oeiras", volumeM3: 28, trips: 1, status: "scheduled", phase: null, vehicle: "Furgão V-02", crewCount: 3, time: "14:30" },
  { id: "MD-0819", client: "Ana Ribeiro", kind: "private", typology: "T1", from: "Alvalade", to: "Campo de Ourique", volumeM3: 14, trips: 1, status: "done", phase: null, vehicle: "Furgão V-01", crewCount: 2, time: "11:15" },
  { id: "MD-0827", client: "Escritórios Delta", kind: "office-material", typology: null, from: "Amadora", to: "Lisboa", volumeM3: 18, trips: 1, status: "unassigned", phase: null, vehicle: null, crewCount: 0, time: null },
];

export const STAGES: readonly Stage[] = [
  { key: "new", count: 3, tone: "neutral" },
  { key: "link-sent", count: 5, tone: "neutral" },
  { key: "inventory-received", count: 2, tone: "warn" },
  { key: "proposal-sent", count: 4, tone: "neutral" },
  { key: "won", count: 3, tone: "success" },
];

export const ACTIVITY: readonly ActivityItem[] = [
  { time: "15:42", tone: "primary", ref: "MD-0821", event: "arrived", detail: { kind: "place", place: "Parque das Nações" } },
  { time: "14:18", tone: "ink", ref: "MD-0824", event: "crew-left", detail: { kind: "crew", vehicle: "Furgão V-02", crewCount: 3 } },
  { time: "13:05", tone: "success", ref: "MD-0830", event: "proposal-accepted", detail: { kind: "signed" } },
  { time: "11:30", tone: "success", ref: "MD-0819", event: "delivery-done", detail: { kind: "place", place: "Campo de Ourique" } },
  { time: "10:15", tone: "danger", ref: "#IC-004", event: "incident-logged", detail: { kind: "text", text: "Carga com medidas incorretas" } },
];
