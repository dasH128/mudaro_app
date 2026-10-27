import { z } from "npm:zod@4.6.7";

import { generateInviteLink, sendInvitationEmail } from "../_shared/invitation.ts";
import { createServiceClient, requirePlatformCaller } from "../_shared/platform-caller.ts";

// Convite pendiente del administrador de una empresa (RF-67). Dos modos:
//   email: Auth genera un enlace nuevo y Resend lo envía.
//   link:  Auth genera un enlace nuevo y se devuelve para copiarlo, sin enviar nada.
// El enlace no se guarda en la base: solo existe en esta respuesta.

const PAYLOAD = z.object({ companyId: z.uuid(), mode: z.enum(["email", "link"]) });

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const caller = await requirePlatformCaller(request);
  if (!caller) return json({ code: "unauthorized" }, 401);

  const parsed = PAYLOAD.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ code: "invalid_input" }, 400);
  const { companyId, mode } = parsed.data;

  const supabase = createServiceClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, deactivated_at")
    .eq("id", companyId)
    .maybeSingle();
  if (companyError) {
    console.error("[resend-invite] company lookup failed:", companyError);
    return json({ code: "internal_error" }, 500);
  }
  if (!company) return json({ code: "not_found" }, 404);
  if (company.deactivated_at) return json({ code: "company_deactivated" }, 409);

  // El convite vigente: el administrador más reciente que no está aceptado ni revocado.
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id, email, name")
    .eq("company_id", companyId)
    .eq("role", "administrator")
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (invitationError) {
    console.error("[resend-invite] invitation lookup failed:", invitationError);
    return json({ code: "internal_error" }, 500);
  }
  if (!invitation) return json({ code: "no_pending_invitation" }, 409);

  const link = await generateInviteLink(supabase, invitation.email, invitation.name);
  if (!link) return json({ code: "invitation_failed" }, 502);

  if (mode === "email" && !(await sendInvitationEmail(invitation.email, invitation.name, link))) {
    return json({ code: "email_failed" }, 502);
  }

  // Si falla el registro, el enlace ya existe (y el email ya salió): se deja en el log y se responde igual.
  const sentAt = new Date().toISOString();
  if (mode === "email") {
    const { error: markError } = await supabase.from("invitations").update({ sent_at: sentAt }).eq("id", invitation.id);
    if (markError) console.error("[resend-invite] mark sent failed:", markError);
  }

  const { error: auditError } = await supabase.from("audit_log").insert({
    actor_id: caller.id,
    actor_type: "platform",
    company_id: companyId,
    action: mode === "email" ? "invitation_resent" : "invitation_link_regenerated",
    entity: "invitation",
    entity_id: invitation.id,
    data: mode === "email" ? { detail: invitation.email } : {},
  });
  if (auditError) console.error("[resend-invite] audit failed:", auditError);

  return json(mode === "email" ? { sentAt } : { link }, 200);
});
