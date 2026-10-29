import type { Proposal, ProposalMetrics, ReadyRequest } from "../domain/types";

// Datos de ejemplo de la lista de propuestas. Se sustituyen por consultas a Supabase.
// Las fechas son relativas a "ahora" para que las propuestas de ejemplo no caduquen con el tiempo.

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

type Clock = { now: number };

const dayFrom = ({ now }: Clock, days: number) => new Date(now + days * DAY_MS).toISOString().slice(0, 10);
const hoursAgo = ({ now }: Clock, hours: number) => new Date(now - hours * HOUR_MS).toISOString();

type Seed = Omit<Proposal, "createdAt" | "validUntil" | "acceptedAt" | "rejectionReason"> & {
  createdHoursAgo: number;
  /** Días hasta el fin de validez (negativo = ya pasó). */
  validInDays?: number;
  acceptedHoursAgo?: number;
  rejectionReason?: string;
};

const SEEDS: readonly Seed[] = [
  { id: "PR-0416", version: 1, requestId: "MD-0836", client: "Bruno Reis", from: "Odivelas", to: "Amadora", volumeM3: 15.2, totalCents: 48900, marginPercent: 50, status: "draft", createdHoursAgo: 1 },
  { id: "PR-0415", version: 1, requestId: "MD-0831", client: "Família Moreira", from: "Benfica", to: "Parque das Nações", volumeM3: 38.4, totalCents: 112348, marginPercent: 55, status: "draft", createdHoursAgo: 3 },
  { id: "PR-0414", version: 2, requestId: "MD-0826", client: "TechHub Ibéria", from: "Lisboa", to: "Oeiras", volumeM3: 24, totalCents: 184500, marginPercent: 41, status: "sent", createdHoursAgo: 50, validInDays: 2 },
  { id: "PR-0410", version: 1, requestId: "MD-0822", client: "Rui Fonseca", from: "Odivelas", to: "Loures", volumeM3: 12.6, totalCents: 39852, marginPercent: 52, status: "sent", createdHoursAgo: 96, validInDays: 12 },
  { id: "PR-0409", version: 3, requestId: "MD-0827", client: "Escritórios Delta", from: "Amadora", to: "Lisboa", volumeM3: 21.6, totalCents: 121080, marginPercent: 38, status: "sent", createdHoursAgo: 120, validInDays: 8 },
  { id: "PR-0412", version: 1, requestId: "MD-0830", client: "Carla Mendes", from: "Almada", to: "Seixal", volumeM3: 19.2, totalCents: 64275, marginPercent: 47, status: "accepted", createdHoursAgo: 72, validInDays: 9, acceptedHoursAgo: 2 },
  { id: "PR-0411", version: 1, requestId: "MD-0828", client: "Helena Duarte", from: "Campolide", to: "Belém", volumeM3: 22.8, totalCents: 78640, marginPercent: 46, status: "accepted", createdHoursAgo: 120, validInDays: 5, acceptedHoursAgo: 28 },
  { id: "PR-0408", version: 1, requestId: "MD-0824", client: "Nuno Batista", from: "Cascais", to: "Estoril", volumeM3: 11.4, totalCents: 36200, marginPercent: 51, status: "accepted", createdHoursAgo: 170, validInDays: 3, acceptedHoursAgo: 52 },
  { id: "PR-0406", version: 1, requestId: "MD-0820", client: "Ana Ribeiro", from: "Alvalade", to: "Campo de Ourique", volumeM3: 14, totalCents: 45100, marginPercent: 49, status: "accepted", createdHoursAgo: 240, validInDays: -2, acceptedHoursAgo: 100 },
  { id: "PR-0404", version: 1, requestId: "MD-0817", client: "Família Pinto", from: "Mafra", to: "Sintra", volumeM3: 41.5, totalCents: 139900, marginPercent: 43, status: "accepted", createdHoursAgo: 300, validInDays: -6, acceptedHoursAgo: 150 },
  { id: "PR-0403", version: 1, requestId: "MD-0816", client: "Luís Carvalho", from: "Barreiro", to: "Montijo", volumeM3: 17.3, totalCents: 52800, marginPercent: 48, status: "accepted", createdHoursAgo: 360, validInDays: -9, acceptedHoursAgo: 200 },
  { id: "PR-0402", version: 1, requestId: "MD-0813", client: "Inês Matos", from: "Parede", to: "Carcavelos", volumeM3: 9.6, totalCents: 29750, marginPercent: 53, status: "accepted", createdHoursAgo: 420, validInDays: -12, acceptedHoursAgo: 260 },
  { id: "PR-0401", version: 1, requestId: "MD-0811", client: "Pedro Gomes", from: "Queluz", to: "Mem Martins", volumeM3: 26.1, totalCents: 88400, marginPercent: 45, status: "accepted", createdHoursAgo: 500, validInDays: -15, acceptedHoursAgo: 330 },
  { id: "PR-0400", version: 1, requestId: "MD-0809", client: "Teresa Lima", from: "Moscavide", to: "Sacavém", volumeM3: 13.7, totalCents: 41200, marginPercent: 50, status: "accepted", createdHoursAgo: 560, validInDays: -18, acceptedHoursAgo: 400 },
  { id: "PR-0407", version: 1, requestId: "MD-0818", client: "Joana Lopes", from: "Sintra", to: "Cascais", volumeM3: 30, totalCents: 95500, marginPercent: 44, status: "rejected", createdHoursAgo: 260, validInDays: -3, rejectionReason: "preço acima do previsto" },
  { id: "PR-0405", version: 1, requestId: "MD-0815", client: "Marta Silva", from: "Setúbal", to: "Lisboa", volumeM3: 16.8, totalCents: 72000, marginPercent: 49, status: "expired", createdHoursAgo: 330, validInDays: -4 },
  { id: "PR-0409", version: 1, requestId: "MD-0827", client: "Escritórios Delta", from: "Amadora", to: "Lisboa", volumeM3: 18, totalCents: 98000, marginPercent: 40, status: "superseded", createdHoursAgo: 300 },
  { id: "PR-0409", version: 2, requestId: "MD-0827", client: "Escritórios Delta", from: "Amadora", to: "Lisboa", volumeM3: 20, totalCents: 109500, marginPercent: 39, status: "superseded", createdHoursAgo: 200 },
];

function toProposal(seed: Seed, clock: Clock): Proposal {
  const { createdHoursAgo, validInDays, acceptedHoursAgo, rejectionReason, ...rest } = seed;
  return {
    ...rest,
    createdAt: hoursAgo(clock, createdHoursAgo),
    validUntil: validInDays === undefined ? null : dayFrom(clock, validInDays),
    acceptedAt: acceptedHoursAgo === undefined ? null : hoursAgo(clock, acceptedHoursAgo),
    rejectionReason: rejectionReason ?? null,
  };
}

export function mockProposals(now: Date): readonly Proposal[] {
  const clock = { now: now.getTime() };
  return SEEDS.map((seed) => toProposal(seed, clock));
}

export function mockReadyRequests(now: Date): readonly ReadyRequest[] {
  const clock = { now: now.getTime() };
  return [
    { id: "MD-0833", client: "Pedro Alves", from: "Lumiar", to: "Telheiras", volumeM3: 27.5, receivedAt: hoursAgo(clock, 3), missingMeasures: 0 },
    { id: "MD-0835", client: "Sofia Costa", from: "Arroios", to: "Graça", volumeM3: 9.8, receivedAt: hoursAgo(clock, 5), missingMeasures: 1 },
  ];
}

export const MOCK_METRICS: ProposalMetrics = { acceptanceRate: 0.64, averageDaysToProposal: 1.4 };
