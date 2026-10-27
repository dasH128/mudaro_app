import { z } from "npm:zod@4.6.7";

import { generateInviteLink, sendInvitationEmail } from "../_shared/invitation.ts";
import { createServiceClient, requirePlatformCaller } from "../_shared/platform-caller.ts";

// RF-65: alta de empresa desde el panel interno. Reglas de docs/requirement-mvp.md.
// Las validaciones de la app se repiten aquí: el servidor no se fía del cliente.

const DATE_ISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const OPTIONAL_PHONE = z
  .string()
  .max(20)
  .refine((value) => value === "" || /^(\+351)?\d{9}$/.test(value.replace(/\s+/g, "")), "Telefone inválido.");

const PAYLOAD = z.object({
  name: z.string().trim().min(1).max(200),
  taxId: z.string().regex(/^\d{9}$/),
  region: z.string().max(200),
  phone: OPTIONAL_PHONE,
  emailGeneral: z.string().max(254),
  address: z.string().max(200),
  origin: z.string().max(200),
  notes: z.string().max(2000),
  adminName: z.string().trim().min(1).max(200),
  adminEmail: z.email().max(254),
  adminMobile: OPTIONAL_PHONE,
  imtVerified: z.boolean(),
  imtVerifiedAt: DATE_ISO,
  imtReference: z.string().max(200),
  gdprSigned: z.boolean(),
  gdprSignedAt: DATE_ISO,
  gdprVersion: z.string().max(200),
  sendInvitation: z.boolean(),
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const caller = await requirePlatformCaller(request);
  if (!caller) return json({ code: "unauthorized" }, 401);

  const parsed = PAYLOAD.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ code: "invalid_input", fields: parsed.error.flatten().fieldErrors }, 400);
  }
  const input = parsed.data;
  const supabase = createServiceClient();

  // 1. Empresa, datos internos, convite pendiente y auditoría: una sola transacción en la base de datos.
  const { data: created, error: createError } = await supabase.rpc("create_company_with_invitation", {
    p_company: {
      name: input.name,
      taxId: input.taxId,
      region: input.region,
      phone: input.phone,
      emailGeneral: input.emailGeneral,
      address: input.address,
      origin: input.origin,
      notes: input.notes,
      imtVerified: input.imtVerified,
      imtVerifiedAt: input.imtVerifiedAt,
      imtReference: input.imtReference,
      gdprSigned: input.gdprSigned,
      gdprSignedAt: input.gdprSignedAt,
      gdprVersion: input.gdprVersion,
    },
    p_admin: { name: input.adminName, email: input.adminEmail, mobile: input.adminMobile },
    p_actor_id: caller.id,
  });

  if (createError) {
    // 23505: el NIF ya existe para Portugal (companies_country_tax_id_key).
    if (createError.code === "23505") return json({ code: "tax_id_taken" }, 409);
    console.error("[create-company] rpc failed:", createError);
    return json({ code: "internal_error" }, 500);
  }

  const { company_id, invitation_id } = created as { company_id: string; invitation_id: string };

  // 2. Convite: Auth genera el enlace y Resend envía el email. Si falla, la empresa queda creada con el
  //    convite pendiente (sin sent_at) y se puede reenviar desde el detalle. El enlace no se devuelve:
  //    se genera de nuevo desde el detalle cuando haga falta copiarlo.
  if (!input.sendInvitation) return json({ companyId: company_id, invitationSent: false }, 201);

  const link = await generateInviteLink(supabase, input.adminEmail, input.adminName);
  if (!link || !(await sendInvitationEmail(input.adminEmail, input.adminName, link))) {
    return json({ companyId: company_id, invitationSent: false, code: "invitation_failed" }, 201);
  }

  // 3. Marcar el envío y auditarlo. Si esto falla, el email ya salió: se registra en el log.
  const sentAt = new Date().toISOString();
  const { error: markError } = await supabase.from("invitations").update({ sent_at: sentAt }).eq("id", invitation_id);
  if (markError) console.error("[create-company] mark sent failed:", markError);

  const { error: auditError } = await supabase.from("audit_log").insert({
    actor_id: caller.id,
    actor_type: "platform",
    company_id,
    action: "invitation_sent",
    entity: "invitation",
    entity_id: invitation_id,
    data: { detail: input.adminEmail },
  });
  if (auditError) console.error("[create-company] audit failed:", auditError);

  return json({ companyId: company_id, invitationSent: true }, 201);
});
