export type AuthActionState =
  | { status: "idle" }
  /** `email` devuelve lo escrito para no vaciar el campo tras un error. */
  | { status: "error"; message: string; email?: string };

export const IDLE: AuthActionState = { status: "idle" };

export type EnrollState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "enrolling"; factorId: string; qrCode: string; secret: string };

export const IDLE_ENROLL: EnrollState = { status: "idle" };

// Mensajes genéricos a propósito: no revelan si el email existe.
export const CREDENTIALS_ERROR = "Não foi possível entrar. Confirme o email e a palavra-passe.";
export const CODE_FORMAT_ERROR = "Introduza o código de 6 dígitos.";
export const CODE_INVALID_ERROR = "Código inválido ou expirado. Tente novamente.";
export const ENROLL_ERROR = "Não foi possível gerar o código QR. Tente novamente.";
