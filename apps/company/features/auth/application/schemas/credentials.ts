import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";

// Se validan en servidor; el cliente solo ayuda (ver CLAUDE.md de la raíz).

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const signInSchema = z.object({
  lang: z.enum(LOCALES),
  email,
  // Sin mínimo: no se revela la política de contraseñas en el login. 72 es el límite de bcrypt en Supabase.
  password: z.string().min(1).max(72),
  next: z.string().max(512).optional(),
});

export const forgotPasswordSchema = z.object({
  lang: z.enum(LOCALES),
  email,
});
