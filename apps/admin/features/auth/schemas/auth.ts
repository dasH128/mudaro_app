import { z } from "zod";

// Se validan en servidor; el cliente solo ayuda (ver CLAUDE.md de la raíz).

export const signInSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1),
});

export const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export const confirmEnrollmentSchema = codeSchema.extend({
  factorId: z.uuid(),
});
