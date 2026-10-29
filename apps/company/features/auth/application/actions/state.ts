/** Los errores son códigos: el componente los traduce con el diccionario del idioma de la URL. */
export type ConfirmInvitationState = { status: "idle" } | { status: "error"; code: "invalid" | "failed" };

export type SetPasswordState =
  | { status: "idle" }
  | { status: "error"; code: "weak" | "mismatch" | "failed" };

export const IDLE = { status: "idle" } as const;
