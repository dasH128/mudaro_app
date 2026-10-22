export type ActionState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string; fieldErrors?: { motivo?: string } };

export const IDLE: ActionState = { status: "idle" };
