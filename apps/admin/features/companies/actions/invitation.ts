"use server";

import { redirect } from "next/navigation";

import { requirePlatformUser } from "@/app/lib/auth";
import { ROUTES } from "@/app/lib/routes";
import { generateInviteLink, resendInvite } from "@/features/companies/data/companies.repo";
import { revalidateCompany } from "./revalidate-company";
import type { ActionState, LinkState } from "./state";

// Cada acción vuelve a comprobar el rol en servidor: la Edge Function `resend-invite` también lo valida.

const MESSAGE_BY_CODE: Record<string, string> = {
  not_found: "Empresa não encontrada.",
  company_deactivated: "Reative a empresa antes de reenviar o convite.",
  no_pending_invitation: "O administrador já aceitou o convite.",
  invitation_failed: "Não foi possível gerar o convite. Tente de novo.",
  email_failed: "Não foi possível enviar o email. Tente de novo.",
};

/** Reenvía el convite. `userId` null = el administrador. Los convites de operários todavía no existen. */
export async function resendInviteAction(companyId: string, userId: string | null): Promise<ActionState> {
  await requirePlatformUser();
  if (userId) return { status: "error", message: "Os convites de operários ainda não estão disponíveis." };

  const result = await resendInvite(companyId);
  if (!result.ok) {
    if (result.code === "unauthorized") redirect(ROUTES.login);
    return { status: "error", message: MESSAGE_BY_CODE[result.code] ?? "Erro inesperado ao reenviar o convite." };
  }

  revalidateCompany(companyId);
  return { status: "ok", message: "Convite reenviado." };
}

/** Genera un enlace nuevo para copiarlo. No envía email y el enlace no se guarda. */
export async function generateLinkAction(companyId: string): Promise<LinkState> {
  await requirePlatformUser();

  const result = await generateInviteLink(companyId);
  if (!result.ok) {
    if (result.code === "unauthorized") redirect(ROUTES.login);
    return { status: "error", message: MESSAGE_BY_CODE[result.code] ?? "Erro inesperado ao gerar o link." };
  }

  // No se revalida la ficha: no cambia ningún dato visible, y el enlace solo vive en el estado del formulario.
  return { status: "ok", link: result.link };
}
