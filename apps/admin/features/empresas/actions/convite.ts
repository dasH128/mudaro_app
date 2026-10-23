"use server";

import { requirePlatformUser } from "@/app/lib/auth";
import { regenerateInviteLink, resendInvite } from "@/features/empresas/data/empresas.repo";
import { revalidarEmpresa } from "./revalidar-empresa";
import type { ActionState } from "./state";

// Cada acción vuelve a comprobar el rol en servidor: no se delega en el layout ni en el proxy.
// TODO(supabase): sustituir las llamadas al almacén en memoria por Edge Functions que validen el rol
// y registren la auditoría (RNF-08).

/** Reenvía el convite a un utilizador pendiente. `userId` null = el administrador. */
export async function resendInviteAction(empresaId: string, userId: string | null): Promise<ActionState> {
  const user = await requirePlatformUser();
  const result = await resendInvite(empresaId, userId, user.name);
  if (!result.ok) return { status: "error", message: result.error };

  revalidarEmpresa(empresaId);
  return { status: "ok", message: `Convite reenviado para ${result.value.email}.` };
}

export async function regenerateLinkAction(empresaId: string): Promise<ActionState> {
  const user = await requirePlatformUser();
  const result = await regenerateInviteLink(empresaId, user.name);
  if (!result.ok) return { status: "error", message: result.error };

  revalidarEmpresa(empresaId);
  return { status: "ok", message: "Novo link gerado." };
}
