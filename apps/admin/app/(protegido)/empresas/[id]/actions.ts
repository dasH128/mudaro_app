"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePlatformUser } from "@/app/lib/auth";
import { ROUTES } from "@/app/lib/routes";
import { changeEstado, regenerateInviteLink, resendInvite } from "../_data/store";
import type { ActionState } from "./_state";

// Cada acción vuelve a comprobar el rol en servidor: no se delega en el layout ni en el proxy.
// TODO(supabase): sustituir las llamadas al almacén en memoria por Edge Functions que validen el rol
// y registren la auditoría (RNF-08).

const motivoSchema = z.string().trim().min(1, "Indique o motivo.").max(200, "Máximo de 200 caracteres.");

function refresh(empresaId: string) {
  revalidatePath(ROUTES.empresas.detail(empresaId));
  revalidatePath(ROUTES.empresas.list);
}

/** Reenvía el convite a un utilizador pendiente. `userId` null = el administrador. */
export async function resendInviteAction(empresaId: string, userId: string | null): Promise<ActionState> {
  const user = await requirePlatformUser();
  const result = await resendInvite(empresaId, userId, user.name);
  if (!result.ok) return { status: "error", message: result.error };

  refresh(empresaId);
  return { status: "ok", message: `Convite reenviado para ${result.value.email}.` };
}

export async function regenerateLinkAction(empresaId: string): Promise<ActionState> {
  const user = await requirePlatformUser();
  const result = await regenerateInviteLink(empresaId, user.name);
  if (!result.ok) return { status: "error", message: result.error };

  refresh(empresaId);
  return { status: "ok", message: "Novo link gerado." };
}

/** Desactiva (con motivo obligatorio) o reactiva la empresa. */
export async function changeEstadoAction(
  empresaId: string,
  desativar: boolean,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePlatformUser();

  let motivo = "";
  if (desativar) {
    const parsed = motivoSchema.safeParse(formData.get("motivo") ?? "");
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Motivo inválido.";
      return { status: "error", message, fieldErrors: { motivo: message } };
    }
    motivo = parsed.data;
  }

  const result = await changeEstado(empresaId, desativar, motivo, user.name);
  if (!result.ok) return { status: "error", message: result.error };

  refresh(empresaId);
  return { status: "ok", message: desativar ? "Empresa desativada." : "Empresa reativada." };
}
