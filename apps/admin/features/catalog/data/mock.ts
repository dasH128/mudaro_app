import type { CareMark, CatalogGroup, CatalogItem } from "../domain/types";

// Datos de ejemplo del prototipo P4. Se sustituyen por consultas a Supabase detrás de `catalog.repo.ts`.

const group = (slug: string, order: number, pt: string, es: string, en: string, icon: string): CatalogGroup => ({
  slug,
  order,
  pt,
  es,
  en,
  icon,
});

export const CATEGORIES: readonly CatalogGroup[] = [
  group("sofas", 10, "Sofás e cadeirões", "Sofás y sillones", "Sofas and armchairs", "sofa"),
  group("tables", 20, "Mesas e cadeiras", "Mesas y sillas", "Tables and chairs", "armchair"),
  group("beds", 30, "Camas e colchões", "Camas y colchones", "Beds and mattresses", "bed-double"),
  group("storage", 40, "Armários e arrumação", "Armarios y almacenaje", "Wardrobes and storage", "archive"),
  group("appliances", 50, "Eletrodomésticos", "Electrodomésticos", "Appliances", "refrigerator"),
  group("electronics", 60, "Eletrónica", "Electrónica", "Electronics", "tv"),
  group("decor", 70, "Decoração", "Decoración", "Decor", "lamp"),
  group("boxes", 80, "Caixas e volumes", "Cajas y bultos", "Boxes and bags", "package"),
  group("special", 90, "Peças especiais", "Piezas especiales", "Special items", "piano"),
];

export const ROOMS: readonly CatalogGroup[] = [
  group("living", 10, "Sala", "Salón", "Living room", "sofa"),
  group("bedroom", 20, "Quarto", "Dormitorio", "Bedroom", "bed"),
  group("kids", 30, "Quarto de criança", "Habitación infantil", "Kids room", "baby"),
  group("kitchen", 40, "Cozinha", "Cocina", "Kitchen", "cooking-pot"),
  group("bathroom", 50, "Casa de banho", "Baño", "Bathroom", "bath"),
  group("office", 60, "Escritório", "Despacho", "Office", "monitor"),
  group("storage", 70, "Garagem e arrecadação", "Garaje y trastero", "Garage and storage", "warehouse"),
  group("outdoor", 80, "Varanda e jardim", "Terraza y jardín", "Balcony and garden", "trees"),
];

const ALL_ROOMS = ROOMS.map((r) => r.slug);

const item = (
  pt: string,
  es: string,
  en: string,
  category: string,
  rooms: readonly string[],
  marks: readonly CareMark[],
  active: boolean,
  index: number,
): CatalogItem => ({ id: `item-${index}`, pt, es, en, category, rooms, marks, active });

type RawItem = [string, string, string, string, readonly string[], readonly CareMark[], boolean];

const RAW: RawItem[] = [
  ["Sofá de 3 lugares", "Sofá de 3 plazas", "3-seat sofa", "sofas", ["living"], [], true],
  ["Cadeirão", "Sillón", "Armchair", "sofas", ["living", "bedroom", "office"], [], true],
  ["Mesa de jantar", "Mesa de comedor", "Dining table", "tables", ["living", "kitchen"], ["disassembly"], true],
  ["Cadeira", "Silla", "Chair", "tables", ["living", "kitchen", "office"], [], true],
  ["Cama de casal (estrutura)", "Cama de matrimonio (estructura)", "Double bed frame", "beds", ["bedroom"], ["disassembly"], true],
  ["Colchão de casal", "Colchón de matrimonio", "Double mattress", "beds", ["bedroom"], [], true],
  ["Roupeiro de 2 portas", "Armario de 2 puertas", "2-door wardrobe", "storage", ["bedroom", "kids"], ["disassembly"], true],
  ["Frigorífico combinado", "Frigorífico combi", "Fridge-freezer", "appliances", ["kitchen"], [], true],
  ["Máquina de lavar roupa", "Lavadora", "Washing machine", "appliances", ["kitchen", "bathroom", "storage"], [], true],
  ["Arca congeladora", "Arcón congelador", "", "appliances", ["kitchen", "storage"], [], false],
  ["Televisor 55\"", "Televisor de 55\"", "55\" TV", "electronics", ["living", "bedroom"], ["fragile"], true],
  ["Espelho grande", "Espejo grande", "", "decor", ["living", "bedroom", "bathroom"], ["fragile"], true],
  ["Caixa média", "Caja mediana", "Medium box", "boxes", ALL_ROOMS, [], true],
  ["Piano vertical", "Piano vertical", "Upright piano", "special", ["living"], ["extra_crew"], true],
  ["Cofre", "", "", "special", ["office", "bedroom"], ["extra_crew"], true],
];

export const ITEMS: readonly CatalogItem[] = RAW.map((r, i) => item(...r, i));
