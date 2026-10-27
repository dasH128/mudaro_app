export type ActionState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string; fieldErrors?: { reason?: string } };

export const IDLE: ActionState = { status: "idle" };

/** Resultado de generar un enlace de convite: el enlace solo existe en este estado, no se guarda. */
export type LinkState =
  | { status: "idle" }
  | { status: "ok"; link: string }
  | { status: "error"; message: string };

export const IDLE_LINK: LinkState = { status: "idle" };
