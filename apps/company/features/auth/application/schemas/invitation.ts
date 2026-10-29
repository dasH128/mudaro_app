import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";

// Se validan en servidor; el cliente solo ayuda (ver CLAUDE.md de la raíz).

export const confirmInvitationSchema = z.object({
  lang: z.enum(LOCALES),
  tokenHash: z.string().min(1).max(256),
});

export const setPasswordSchema = z
  .object({
    lang: z.enum(LOCALES),
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"] });
