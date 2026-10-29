import type { ActivityItem, Job, Stage, Stat } from "../domain/types";

// Datos de ejemplo del prototipo "Operações de hoje". Se sustituyen por consultas a Supabase.

export const STATS: readonly Stat[] = [
  { kind: "jobs-today", label: "Trabalhos hoje", value: "4", tone: "warn", hint: "face a ontem", delta: "+1" },
  { kind: "in-progress", label: "Em curso", value: "2", tone: "success", hint: "Equipas na rua agora" },
  { kind: "incidents", label: "Incidências", value: "1", tone: "danger", hint: "Pendente de revisão" },
];

export const JOBS: readonly Job[] = [
  { id: "MD-0821", client: "Família Moreira", kind: "Mudança integral, T3", from: "Benfica", to: "Parque das Nações", volume: "64 m³ · 2 viagens", status: "in-progress", statusLabel: "Em descarga", vehicle: "Camião 18 t · AA-12-BC", crew: "4 operários", time: "15:45" },
  { id: "MD-0824", client: "TechHub Ibéria", kind: "Transferência de escritório", from: "Lisboa", to: "Oeiras", volume: "28 m³ · 1 viagem", status: "scheduled", statusLabel: "Programado", vehicle: "Furgão V-02", crew: "3 operários", time: "14:30" },
  { id: "MD-0819", client: "Ana Ribeiro", kind: "Particular, T1", from: "Alvalade", to: "Campo de Ourique", volume: "14 m³ · 1 viagem", status: "done", statusLabel: "Concluído", vehicle: "Furgão V-01", crew: "2 operários", time: "11:15" },
  { id: "MD-0827", client: "Escritórios Delta", kind: "Material de escritório", from: "Amadora", to: "Lisboa", volume: "18 m³ · 1 viagem", status: "unassigned", statusLabel: "Por atribuir", vehicle: "Sem veículo", crew: "Sem equipa", time: "—" },
];

export const STAGES: readonly Stage[] = [
  { label: "Novos", count: "3", hint: "Sem link enviado", tone: "neutral" },
  { label: "Link enviado", count: "5", hint: "Cliente a preencher", tone: "neutral" },
  { label: "Inventário recebido", count: "2", hint: "Prontos para orçamentar", tone: "warn" },
  { label: "Proposta enviada", count: "4", hint: "À espera de resposta", tone: "neutral" },
  { label: "Ganhos", count: "3", hint: "Esta semana", tone: "success" },
];

export const ACTIVITY: readonly ActivityItem[] = [
  { time: "15:42", tone: "primary", ref: "MD-0821", text: "Chegou ao destino", sub: "Parque das Nações" },
  { time: "14:18", tone: "ink", ref: "MD-0824", text: "Equipa saiu da base", sub: "Furgão V-02, 3 operários" },
  { time: "13:05", tone: "success", ref: "MD-0830", text: "Proposta aceite", sub: "Assinada pelo cliente" },
  { time: "11:30", tone: "success", ref: "MD-0819", text: "Entrega concluída", sub: "Campo de Ourique" },
  { time: "10:15", tone: "danger", ref: "#IC-004", text: "Incidência registada", sub: "Carga com medidas incorretas" },
];
