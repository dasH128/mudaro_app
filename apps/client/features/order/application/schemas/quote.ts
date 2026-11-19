import { z } from "zod";

import { isLinkToken } from "@/features/order/domain/types";

// Aceptar o rechazar el orçamento desde el enlace (RF-43, RF-44). La Edge Function y la base lo vuelven a comprobar:
// enlace, estado, validez (RF-45) y que la huella sea la del orçamento vigente.

const token = z.string().refine(isLinkToken);

export const acceptSchema = z.object({
  token,
  quoteId: z.uuid(),
  documentHash: z.string().regex(/^[0-9a-f]{64}$/),
  selectedLineIds: z.array(z.uuid()).max(50),
  signerName: z.string().trim().min(1, "nameRequired").max(200, "nameRequired"),
  // PNG del trazo, en data URL. Unos 250 KB como mucho (el bucket admite 256 KB).
  signature: z.string().startsWith("data:image/png;base64,", "signatureRequired").max(350_000, "signatureTooLarge"),
});

export const rejectSchema = z.object({
  token,
  quoteId: z.uuid(),
  reason: z.string().trim().max(500),
});
