import type { ClientSuggestion, Flexibility, OrderListItem, OrderNote, OrderStage, OrdersMetrics } from "../domain/types";

// Datos de ejemplo de clientes. Se sustituyen por consultas a Supabase (RLS por company_id, RNF-01).
// Para probar la sugerencia por teléfono (RF-14): 912 345 821 (Ana) o 916 667 777 (Rui).

export function mockClients(today: string): readonly (ClientSuggestion & { phone: string })[] {
  return [
    {
      id: "client-ana-ribeiro",
      phone: "+351912345821",
      name: "Ana Ribeiro",
      type: "private",
      email: "ana.ribeiro@exemplo.pt",
      orderCount: 1,
      lastOrder: { id: "MD-0819", completedOn: today },
    },
    {
      id: "client-rui-fonseca",
      phone: "+351916667777",
      name: "Rui Fonseca",
      type: "private",
      email: null,
      orderCount: 0,
      lastOrder: null,
    },
  ];
}

// Lista de pedidos: 24 de ejemplo repartidos por etapas (1 · 5 · 3 · 3 · 10 · 2).
// Las fechas son relativas a "ahora" para que los enlaces y las mudanças de ejemplo no caduquen con el tiempo.

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

type Clock = { now: number };

const dayFrom = ({ now }: Clock, days: number) => new Date(now + days * DAY_MS).toISOString().slice(0, 10);
const hoursAgo = ({ now }: Clock, hours: number) => new Date(now - hours * HOUR_MS).toISOString();

type Seed = {
  id: string;
  client: string;
  from: string;
  to: string;
  /** Días hasta la mudança (negativo = ya pasó). */
  moveInDays: number;
  flexibility?: Flexibility;
  stage: OrderStage;
  activityHoursAgo: number;
  note: (clock: Clock) => OrderNote;
};

const SEEDS: readonly Seed[] = [
  { id: "MD-0836", client: "Ana Ribeiro", from: "Benfica", to: "Parque das Nações", moveInDays: 16, flexibility: "two-days", stage: "new", activityHoursAgo: 0.2, note: () => ({ kind: "just-created" }) },
  { id: "MD-0833", client: "Pedro Alves", from: "Lumiar", to: "Telheiras", moveInDays: 20, stage: "inventory-received", activityHoursAgo: 3, note: (c) => ({ kind: "inventory-ready", receivedAt: hoursAgo(c, 3), items: 31, volumeM3: 27.5 }) },
  { id: "MD-0835", client: "Sofia Costa", from: "Arroios", to: "Graça", moveInDays: 22, stage: "inventory-received", activityHoursAgo: 26, note: (c) => ({ kind: "inventory-missing-measures", receivedAt: hoursAgo(c, 26), missing: 1 }) },
  { id: "MD-0831", client: "Família Moreira", from: "Benfica", to: "Parque das Nações", moveInDays: 16, stage: "inventory-received", activityHoursAgo: 4, note: (c) => ({ kind: "draft-proposal", savedAt: hoursAgo(c, 4) }) },
  { id: "MD-0829", client: "Teresa Nunes", from: "Almada", to: "Lisboa", moveInDays: 10, stage: "awaiting-inventory", activityHoursAgo: 70, note: (c) => ({ kind: "link-expiring", validUntil: dayFrom(c, 1) }) },
  { id: "MD-0834", client: "Bruno Carvalho", from: "Amadora", to: "Sintra", moveInDays: 17, stage: "awaiting-inventory", activityHoursAgo: 120, note: () => ({ kind: "no-news", days: 5 }) },
  { id: "MD-0832", client: "Hugo Martins", from: "Oeiras", to: "Cascais", moveInDays: 40, flexibility: "month", stage: "awaiting-inventory", activityHoursAgo: 30, note: (c) => ({ kind: "filling", validUntil: dayFrom(c, 12) }) },
  { id: "MD-0825", client: "Paulo Vieira", from: "Loures", to: "Odivelas", moveInDays: 25, flexibility: "one-week", stage: "awaiting-inventory", activityHoursAgo: 40, note: (c) => ({ kind: "filling", validUntil: dayFrom(c, 9) }) },
  { id: "MD-0823", client: "Mariana Teixeira", from: "Algés", to: "Carnaxide", moveInDays: 30, stage: "awaiting-inventory", activityHoursAgo: 52, note: (c) => ({ kind: "filling", validUntil: dayFrom(c, 6) }) },
  { id: "MD-0826", client: "TechHub Ibéria", from: "Lisboa", to: "Oeiras", moveInDays: 9, stage: "quoted", activityHoursAgo: 50, note: (c) => ({ kind: "proposal-sent", version: 2, validUntil: dayFrom(c, 2) }) },
  { id: "MD-0822", client: "Rui Fonseca", from: "Odivelas", to: "Loures", moveInDays: 21, stage: "quoted", activityHoursAgo: 96, note: (c) => ({ kind: "proposal-sent", version: 1, validUntil: dayFrom(c, 12) }) },
  { id: "MD-0827", client: "Escritórios Delta", from: "Amadora", to: "Lisboa", moveInDays: 18, stage: "quoted", activityHoursAgo: 120, note: (c) => ({ kind: "proposal-sent", version: 3, validUntil: dayFrom(c, 8) }) },
  { id: "MD-0830", client: "Carla Mendes", from: "Almada", to: "Seixal", moveInDays: 7, stage: "won", activityHoursAgo: 2, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 2) }) },
  { id: "MD-0828", client: "Helena Duarte", from: "Campolide", to: "Belém", moveInDays: 5, stage: "won", activityHoursAgo: 28, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 28) }) },
  { id: "MD-0824", client: "Nuno Batista", from: "Cascais", to: "Estoril", moveInDays: 3, stage: "won", activityHoursAgo: 52, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 52) }) },
  { id: "MD-0820", client: "Ana Ribeiro", from: "Alvalade", to: "Campo de Ourique", moveInDays: -2, stage: "won", activityHoursAgo: 100, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 100) }) },
  { id: "MD-0817", client: "Família Pinto", from: "Mafra", to: "Sintra", moveInDays: -6, stage: "won", activityHoursAgo: 150, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 150) }) },
  { id: "MD-0816", client: "Luís Carvalho", from: "Barreiro", to: "Montijo", moveInDays: -9, stage: "won", activityHoursAgo: 200, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 200) }) },
  { id: "MD-0813", client: "Inês Matos", from: "Parede", to: "Carcavelos", moveInDays: -12, stage: "won", activityHoursAgo: 260, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 260) }) },
  { id: "MD-0811", client: "Pedro Gomes", from: "Queluz", to: "Mem Martins", moveInDays: -15, stage: "won", activityHoursAgo: 330, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 330) }) },
  { id: "MD-0809", client: "Teresa Lima", from: "Moscavide", to: "Sacavém", moveInDays: -18, stage: "won", activityHoursAgo: 400, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 400) }) },
  { id: "MD-0806", client: "Rita Faria", from: "Seixal", to: "Almada", moveInDays: -22, stage: "won", activityHoursAgo: 480, note: (c) => ({ kind: "won", signedAt: hoursAgo(c, 480) }) },
  { id: "MD-0818", client: "Joana Lopes", from: "Sintra", to: "Cascais", moveInDays: -4, stage: "lost", activityHoursAgo: 240, note: () => ({ kind: "lost", reason: "preço acima do previsto" }) },
  { id: "MD-0815", client: "Marta Silva", from: "Setúbal", to: "Lisboa", moveInDays: -8, stage: "lost", activityHoursAgo: 330, note: () => ({ kind: "lost", reason: null }) },
];

export function mockOrders(now: Date): readonly OrderListItem[] {
  const clock = { now: now.getTime() };
  return SEEDS.map(({ moveInDays, flexibility, activityHoursAgo, note, ...rest }) => ({
    ...rest,
    date: dayFrom(clock, moveInDays),
    flexibility: flexibility ?? "exact",
    lastActivityAt: hoursAgo(clock, activityHoursAgo),
    note: note(clock),
  }));
}

/** Semana ISO (1-53) de un día. */
function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7);
}

export function mockOrdersMetrics(now: Date): OrdersMetrics {
  const counts = [2, 4, 3, 5];
  return {
    newThisMonth: 14,
    wonThisMonth: 6,
    weekly: counts.map((count, index) => ({
      week: isoWeek(new Date(now.getTime() - (counts.length - 1 - index) * 7 * DAY_MS)),
      count,
    })),
  };
}
