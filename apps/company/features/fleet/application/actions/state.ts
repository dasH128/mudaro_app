import type { FormState } from "../schemas/new-vehicle";

/** Los errores son códigos: el formulario los traduce con el diccionario del idioma de la URL. */
export type { FormState };

export const IDLE: FormState = { status: "idle" };
