import { addDays } from "@/features/fleet/domain/fleet";
import type { Client, ClientOrder, ContactEvent } from "../domain/types";

// Datos de ejemplo de los clientes. Se sustituyen por consultas a Supabase (RLS por company_id, RNF-01).
// Las fechas son relativas a hoy para que "amanhã" o "há 5 dias" no se desfasen con el tiempo.
// Teléfonos, emails y NIF son inventados (los NIF pasan la validación del dígito de control).

type OrderSeed = Omit<ClientOrder, "moveOn"> & { inDays: number };
type Seed = Omit<Client, "lastContact" | "sinceOn" | "orders" | "email" | "phone" | "duplicate" | "summary"> & {
  summary: Client["summary"] | ((today: string) => Client["summary"]);
  /** Se llama igual que el cliente salvo que se indique otro teléfono. */
  phone: string;
  hasEmail: boolean;
  sinceDaysAgo: number;
  contactDaysAgo: number;
  contactEvent?: ContactEvent;
  orders: OrderSeed[];
  duplicate?: { name: string; phone: string; hasEmail: boolean; orderId: string; lostInDays: number };
};

const lastContact = { kind: "last-contact" } as const;

const SEEDS: Seed[] = [
  {
    id: "techhub", name: "TechHub Ibéria", type: "company", phone: "+351912346001", hasEmail: true, taxId: "501234560",
    sinceDaysAgo: 55, stage: "in-progress", summary: { kind: "in-progress", orderId: "MD-0824", quoteExpiring: true },
    contactDaysAgo: 0, contactEvent: "move-in-progress",
    orders: [
      { id: "MD-0826", route: "Lisboa → Oeiras", inDays: 8, stage: "quoted", note: { kind: "quote-sent", version: 2, expiresInDays: 2 }, acceptedCents: null },
      { id: "MD-0824", route: "Lisboa → Oeiras", inDays: 0, stage: "in-progress", note: { kind: "in-progress", vehicle: "Furgão V-02", crew: ["André", "Tiago"] }, acceptedCents: 289_000 },
      { id: "MD-0790", route: "Lisboa → Lisboa", inDays: -49, stage: "done", note: { kind: "closed", amountCents: 198_000 }, acceptedCents: 198_000 },
    ],
    addresses: [{ text: "Av. da Liberdade, Lisboa", use: { kind: "orders", count: 3 } }, { text: "Lagoas Park, Oeiras", use: { kind: "orders", count: 2 } }],
  },
  {
    id: "moreira", name: "Família Moreira", type: "private", phone: "+351912346002", hasEmail: true, taxId: null,
    sinceDaysAgo: 20, stage: "in-progress", summary: { kind: "today-draft", orderId: "MD-0821" },
    contactDaysAgo: 0, contactEvent: "pickup-signed",
    orders: [
      { id: "MD-0831", route: "Benfica → Parque das Nações", inDays: 15, stage: "inventory-received", note: { kind: "draft", since: "10:31" }, acceptedCents: null },
      { id: "MD-0821", route: "Benfica → Parque das Nações", inDays: 0, stage: "in-progress", note: { kind: "in-progress", vehicle: "Camião grande", crew: ["Rui", "Paulo"] }, acceptedCents: 112_300 },
    ],
    addresses: [{ text: "Benfica, Lisboa", use: { kind: "origin" } }, { text: "Parque das Nações, Lisboa", use: { kind: "destination" } }],
  },
  {
    id: "pedro", name: "Pedro Alves", type: "private", phone: "+351912346003", hasEmail: true, taxId: null,
    sinceDaysAgo: 12, stage: "inventory-received", summary: { kind: "inventory-arrived", orderId: "MD-0833", hoursAgo: 3 },
    contactDaysAgo: 0, contactEvent: "sent-inventory",
    orders: [{ id: "MD-0833", route: "Alvalade → Campo Grande", inDays: 20, stage: "inventory-received", note: lastContact, acceptedCents: null }],
    addresses: [{ text: "Alvalade, Lisboa", use: { kind: "see-order" } }],
  },
  {
    id: "sofiac", name: "Sofia Costa", type: "private", phone: "+351912346004", hasEmail: true, taxId: null,
    sinceDaysAgo: 9, stage: "inventory-received", summary: { kind: "missing-measure", orderId: "MD-0835", objects: 1 },
    contactDaysAgo: 1, contactEvent: "sent-inventory",
    orders: [{ id: "MD-0835", route: "Telheiras → Belém", inDays: 22, stage: "inventory-received", note: lastContact, acceptedCents: null }],
    addresses: [{ text: "Telheiras, Lisboa", use: { kind: "see-order" } }],
  },
  {
    id: "teresa", name: "Teresa Nunes", type: "private", phone: "+351912346005", hasEmail: false, taxId: null,
    sinceDaysAgo: 7, stage: "awaiting-inventory", summary: { kind: "link-expires", orderId: "MD-0829" },
    contactDaysAgo: 6,
    orders: [{ id: "MD-0829", route: "Campolide → Odivelas", inDays: 25, stage: "awaiting-inventory", note: lastContact, acceptedCents: null }],
    addresses: [{ text: "Campolide, Lisboa", use: { kind: "see-order" } }],
  },
  {
    id: "brunoc", name: "Bruno Carvalho", type: "private", phone: "+351912346006", hasEmail: true, taxId: null,
    sinceDaysAgo: 8, stage: "awaiting-inventory", summary: { kind: "no-news", orderId: "MD-0828", days: 5 },
    contactDaysAgo: 5,
    orders: [{ id: "MD-0828", route: "Almada → Seixal", inDays: 28, stage: "awaiting-inventory", note: lastContact, acceptedCents: null }],
    addresses: [{ text: "Almada", use: { kind: "see-order" } }],
  },
  {
    id: "ana", name: "Ana Ribeiro", type: "private", phone: "+351912346007", hasEmail: false, taxId: null,
    sinceDaysAgo: 0, stage: "new", summary: { kind: "share-link", orderId: "MD-0836" },
    contactDaysAgo: 0, contactEvent: "order-created",
    orders: [{ id: "MD-0836", route: "Arroios → Areeiro", inDays: 30, stage: "new", note: lastContact, acceptedCents: null }],
    addresses: [{ text: "Arroios, Lisboa", use: { kind: "see-order" } }],
  },
  {
    id: "rita", name: "Rita Gomes", type: "private", phone: "+351912346008", hasEmail: true, taxId: null,
    sinceDaysAgo: 75, stage: "scheduled", summary: (today) => ({ kind: "scheduled", orderId: "MD-0838", on: addDays(today, 1), time: "08:00" }),
    contactDaysAgo: 4, contactEvent: "accepted-quote",
    orders: [
      { id: "MD-0838", route: "Penha de França → Olivais", inDays: 1, stage: "scheduled", note: { kind: "short-staffed", time: "08:00", missing: 1 }, acceptedCents: 64_000 },
      { id: "MD-0772", route: "Penha de França → Olivais", inDays: -72, stage: "lost", note: { kind: "other-file", fileName: "Rita G." }, acceptedCents: null },
    ],
    addresses: [{ text: "Penha de França, Lisboa", use: { kind: "origin" } }, { text: "Olivais, Lisboa", use: { kind: "destination" } }],
    duplicate: { name: "Rita G.", phone: "+351912346008", hasEmail: false, orderId: "MD-0772", lostInDays: -72 },
  },
  {
    id: "luis", name: "Luís Pereira", type: "private", phone: "+351912346009", hasEmail: true, taxId: null,
    sinceDaysAgo: 14, stage: "scheduled", summary: (today) => ({ kind: "scheduled", orderId: "MD-0840", on: addDays(today, 1), time: "09:00" }),
    contactDaysAgo: 5, contactEvent: "accepted-quote",
    orders: [{ id: "MD-0840", route: "Graça → Marvila", inDays: 1, stage: "scheduled", note: { kind: "scheduled", vehicle: "Camião grande", start: "09:00", end: "13:00" }, acceptedCents: 52_000 }],
    addresses: [{ text: "Graça, Lisboa", use: { kind: "origin" } }, { text: "Marvila, Lisboa", use: { kind: "destination" } }],
  },
  {
    id: "delta", name: "Escritórios Delta", type: "company", phone: "+351912346010", hasEmail: true, taxId: null,
    sinceDaysAgo: 9, stage: "scheduled", summary: (today) => ({ kind: "scheduled", orderId: "MD-0827", on: addDays(today, 3), time: "08:00" }),
    contactDaysAgo: 8, contactEvent: "accepted-quote",
    orders: [{ id: "MD-0827", route: "Amadora → Lisboa", inDays: 3, stage: "scheduled", note: { kind: "scheduled", vehicle: "Camião grande", start: "08:00", end: "15:00" }, acceptedCents: 235_000 }],
    addresses: [{ text: "Amadora", use: { kind: "origin" } }, { text: "Saldanha, Lisboa", use: { kind: "destination" } }],
  },
  {
    id: "carla", name: "Carla Mendes", type: "private", phone: "+351912346011", hasEmail: true, taxId: null,
    sinceDaysAgo: 16, stage: "scheduled", summary: (today) => ({ kind: "scheduled", orderId: "MD-0830", on: addDays(today, 5), time: "08:00" }),
    contactDaysAgo: 2, contactEvent: "accepted-signed",
    orders: [{ id: "MD-0830", route: "Oeiras → Cascais", inDays: 5, stage: "scheduled", note: { kind: "scheduled", vehicle: "Camião médio", start: "08:00", end: "13:00" }, acceptedCents: 69_000 }],
    addresses: [{ text: "Oeiras", use: { kind: "origin" } }, { text: "Cascais", use: { kind: "destination" } }],
  },
  {
    id: "sofial", name: "Sofia Lima", type: "private", phone: "+351912346012", hasEmail: true, taxId: null,
    sinceDaysAgo: 18, stage: "scheduled", summary: (today) => ({ kind: "scheduled", orderId: "MD-0846", on: addDays(today, 6), time: "08:00", noResources: true }),
    contactDaysAgo: 1, contactEvent: "accepted-quote",
    orders: [{ id: "MD-0846", route: "Sintra → Mem Martins", inDays: 6, stage: "scheduled", note: lastContact, acceptedCents: 78_000 }],
    addresses: [{ text: "Sintra", use: { kind: "see-order" } }],
  },
  {
    id: "anac", name: "Ana Costa", type: "private", phone: "+351912346013", hasEmail: false, taxId: null,
    sinceDaysAgo: 25, stage: "done", summary: (today) => ({ kind: "delivered", orderId: "MD-0817", on: addDays(today, -3) }),
    contactDaysAgo: 3, contactEvent: "signed-delivery",
    orders: [{ id: "MD-0817", route: "Lumiar → Benfica", inDays: -3, stage: "done", note: { kind: "closed", amountCents: 41_000 }, acceptedCents: 41_000 }],
    addresses: [{ text: "Lumiar, Lisboa", use: { kind: "origin" } }, { text: "Benfica, Lisboa", use: { kind: "destination" } }],
  },
  {
    id: "joanaf", name: "Joana Freitas", type: "private", phone: "+351912346014", hasEmail: true, taxId: null,
    sinceDaysAgo: 30, stage: "done", summary: (today) => ({ kind: "closed", orderId: "MD-0815", on: addDays(today, -5) }),
    contactDaysAgo: 5, contactEvent: "signed-delivery",
    orders: [{ id: "MD-0815", route: "Restelo → Ajuda", inDays: -5, stage: "done", note: { kind: "closed", amountCents: 45_500 }, acceptedCents: 45_500 }],
    addresses: [{ text: "Restelo, Lisboa", use: { kind: "origin" } }, { text: "Ajuda, Lisboa", use: { kind: "destination" } }],
  },
  {
    id: "joanal", name: "Joana Lopes", type: "private", phone: "+351912346015", hasEmail: true, taxId: null,
    sinceDaysAgo: 28, stage: "lost", summary: { kind: "lost", orderId: "MD-0818", reason: "achou o preço alto" },
    contactDaysAgo: 11, contactEvent: "declined-quote",
    orders: [{ id: "MD-0818", route: "Parede → Estoril", inDays: 12, stage: "lost", note: lastContact, acceptedCents: null }],
    addresses: [{ text: "Parede", use: { kind: "see-order" } }],
  },
];

/** "Rita Gomes" → "rita.gomes@exemplo.pt" (sin tildes). */
function exampleEmail(name: string): string {
  return `${name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, ".")}@exemplo.pt`;
}

/** Clientes de ejemplo con las fechas calculadas desde `today` (aaaa-mm-dd). */
export function mockClients(today: string): Client[] {
  return SEEDS.map(({ summary, hasEmail, sinceDaysAgo, contactDaysAgo, contactEvent, orders, duplicate, ...client }) => ({
    ...client,
    email: hasEmail ? exampleEmail(client.name) : null,
    sinceOn: addDays(today, -sinceDaysAgo),
    summary: typeof summary === "function" ? summary(today) : summary,
    lastContact: { on: addDays(today, -contactDaysAgo), event: contactEvent },
    orders: orders.map(({ inDays, ...order }) => ({ ...order, moveOn: addDays(today, inDays) })),
    duplicate: duplicate
      ? { name: duplicate.name, phone: duplicate.phone, hasEmail: duplicate.hasEmail, orderId: duplicate.orderId, lostOn: addDays(today, duplicate.lostInDays) }
      : undefined,
  }));
}
