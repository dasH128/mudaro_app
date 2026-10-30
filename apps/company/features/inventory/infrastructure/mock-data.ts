import type { CatalogItem, ExtraService } from "../domain/types";

// Datos de ejemplo del catálogo y de los extras de la empresa.
// TODO(supabase): sustituir por el catálogo de la empresa y los extras activos de Tarifas y extras.

export const mockCatalog: readonly CatalogItem[] = [
  { id: "sofa3", room: "living-room", name: "Sofá de 3 lugares", volumeM3: 1.6, flags: [] },
  { id: "sofa2", room: "living-room", name: "Sofá de 2 lugares", volumeM3: 1.2, flags: [] },
  { id: "armchair", room: "living-room", name: "Poltrona", volumeM3: 0.5, flags: [] },
  { id: "dining-table", room: "living-room", name: "Mesa de jantar", volumeM3: 0.8, flags: ["dismantle"] },
  { id: "chair", room: "living-room", name: "Cadeira", volumeM3: 0.1, flags: [] },
  { id: "bookcase", room: "living-room", name: "Estante", volumeM3: 0.6, flags: ["dismantle"] },
  { id: "tv-unit", room: "living-room", name: "Móvel de TV", volumeM3: 0.5, flags: [] },
  { id: "tv", room: "living-room", name: "Televisão", volumeM3: 0.1, flags: ["fragile"] },
  { id: "floor-lamp", room: "living-room", name: "Candeeiro de pé", volumeM3: 0.1, flags: ["fragile"] },

  { id: "double-bed", room: "bedroom", name: "Cama de casal", volumeM3: 1.5, flags: ["dismantle"] },
  { id: "single-bed", room: "bedroom", name: "Cama de solteiro", volumeM3: 0.9, flags: ["dismantle"] },
  { id: "wardrobe", room: "bedroom", name: "Roupeiro de 2 portas", volumeM3: 1.4, flags: ["dismantle"] },
  { id: "dresser", room: "bedroom", name: "Cómoda", volumeM3: 0.9, flags: [] },
  { id: "bedside-table", room: "bedroom", name: "Mesa de cabeceira", volumeM3: 0.1, flags: [] },
  { id: "mirror", room: "bedroom", name: "Espelho", volumeM3: 0.1, flags: ["fragile"] },

  { id: "fridge", room: "kitchen", name: "Frigorífico", volumeM3: 0.6, flags: [] },
  { id: "washing-machine", room: "kitchen", name: "Máquina de lavar roupa", volumeM3: 0.4, flags: [] },
  { id: "dishwasher", room: "kitchen", name: "Máquina de lavar loiça", volumeM3: 0.4, flags: [] },
  { id: "microwave", room: "kitchen", name: "Micro-ondas", volumeM3: 0.1, flags: [] },
  { id: "dish-box", room: "kitchen", name: "Caixa de loiça", volumeM3: 0.1, flags: ["fragile"] },
  { id: "kitchen-table", room: "kitchen", name: "Mesa de cozinha", volumeM3: 0.5, flags: [] },

  { id: "bathroom-cabinet", room: "bathroom", name: "Móvel de casa de banho", volumeM3: 0.3, flags: [] },
  { id: "laundry-basket", room: "bathroom", name: "Cesto de roupa", volumeM3: 0.1, flags: [] },

  { id: "box-small", room: "boxes", name: "Caixa pequena", volumeM3: 0.05, flags: [] },
  { id: "box-medium", room: "boxes", name: "Caixa média", volumeM3: 0.1, flags: [] },
  { id: "box-large", room: "boxes", name: "Caixa grande", volumeM3: 0.15, flags: [] },
  { id: "box-wardrobe", room: "boxes", name: "Caixa-roupeiro", volumeM3: 0.3, flags: [] },
];

export const mockExtras: readonly ExtraService[] = [
  { id: "dish-packing", name: "Embalagem de loiça", pricing: { kind: "unit", cents: 800 }, defaultQuantity: { value: 3, unit: "boxes" } },
  { id: "dismantling", name: "Desmontagem e montagem", pricing: { kind: "hour", cents: 3000 }, defaultQuantity: { value: 2, unit: "hours" } },
  { id: "storage", name: "Guarda-móveis", pricing: { kind: "m3-month", cents: 1200 }, defaultQuantity: null },
  { id: "junk-removal", name: "Retirada de monos", pricing: { kind: "fixed", cents: 4500 }, defaultQuantity: null },
];
