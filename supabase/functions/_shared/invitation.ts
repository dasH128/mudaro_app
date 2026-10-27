import type { SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";

/**
 * Genera el enlace de invitación con Auth, sin enviar ningún email. Si el usuario no existe lo crea
 * (sin confirmar); si ya existe y no ha aceptado, devuelve un enlace nuevo.
 * Devuelve null si Auth falla: el detalle queda en el log y no sale hacia fuera.
 */
export async function generateInviteLink(
  supabase: SupabaseClient,
  email: string,
  name: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "invite",
    email,
    // Sin INVITE_REDIRECT_URL, Auth usa el Site URL del proyecto.
    options: { data: { name }, redirectTo: Deno.env.get("INVITE_REDIRECT_URL") || undefined },
  });

  const link = data?.properties?.action_link;
  if (error || !link) {
    console.error("[invitation] generateLink failed:", error);
    return null;
  }
  return link;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Envía el convite con Resend. Devuelve false si falta configuración o si Resend rechaza el envío. */
export async function sendInvitationEmail(to: string, name: string, link: string): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM");
  if (!apiKey || !from) {
    console.error("[invitation] RESEND_API_KEY or RESEND_FROM is not set");
    return false;
  }

  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(link);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Convite para a Mudaro",
      html: [
        `<p>Olá ${safeName},</p>`,
        "<p>Foi convidado para administrar a sua empresa na Mudaro.</p>",
        `<p><a href="${safeLink}">Aceitar convite</a></p>`,
        `<p>Se o botão não funcionar, copie este endereço para o navegador:<br>${safeLink}</p>`,
        "<p>Se não esperava este email, pode ignorá-lo.</p>",
      ].join("\n"),
      text: [
        `Olá ${name},`,
        "",
        "Foi convidado para administrar a sua empresa na Mudaro.",
        `Aceite o convite neste endereço: ${link}`,
        "",
        "Se não esperava este email, pode ignorá-lo.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    console.error("[invitation] Resend failed:", response.status, await response.text());
    return false;
  }
  return true;
}
