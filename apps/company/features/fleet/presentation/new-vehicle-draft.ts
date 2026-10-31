import type { FormValues } from "../application/schemas/new-vehicle";
import { isVehicleType } from "../domain/new-vehicle";

// Borrador del formulario de alta en el navegador (localStorage): sobrevive a recargar o salir sin querer.
// Solo vive en este navegador y no se envía a ningún sitio. Todo va en try/catch: el almacenamiento
// puede no estar disponible (ventana privada, datos bloqueados) y el formulario funciona igual sin él.

const KEY = "mudaro:new-vehicle-draft";

const isText = (value: unknown): value is string => typeof value === "string" && value.length <= 200;

/** Lee el borrador guardado. Devuelve `null` si no hay, no es legible o no tiene la forma esperada. */
export function loadDraft(): FormValues | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { type, plate, name, capacity, maxLoad, cost, active } = data as Record<string, unknown>;
    if (typeof type !== "string" || !isVehicleType(type)) return null;
    if (![plate, name, capacity, maxLoad, cost].every(isText)) return null;
    if (active !== "true" && active !== "false") return null;
    return { type, plate: plate as string, name: name as string, capacity: capacity as string, maxLoad: maxLoad as string, cost: cost as string, active };
  } catch {
    return null;
  }
}

/** Guarda el borrador. Devuelve `false` si el navegador no lo permite. */
export function saveDraft(values: FormValues): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(values));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // sin almacenamiento no hay nada que borrar
  }
}
