"use server";

import { redirect } from "next/navigation";

import { requirePlatformUser } from "@/app/lib/auth";
import { ROUTES } from "@/app/lib/routes";
import { todayIso } from "@/app/lib/format";import { createEmpresa } from "../_data/store";
import { nuevaEmpresaSchema, readValues, toFieldErrors, type FormState } from "./_schema";

// RF-65: alta de empresa desde el panel interno.
export async function createEmpresaAction(_previous: FormState, formData: FormData): Promise<FormState> {
  // La autorización no se delega en el proxy ni en el layout: se comprueba también aquí.
  await requirePlatformUser();

  const values = readValues(formData);
  const parsed = nuevaEmpresaSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const { data } = parsed;

  // TODO(supabase): llamar a la Edge Function `crear-empresa`, que valida el rol de plataforma,
  // crea la empresa e invita al administrador (solo si data.enviarConvite). Por ahora se simula en memoria.
  await createEmpresa({
    nome: data.nome,
    nif: data.nif,
    regiao: data.regiao,
    adminNome: data.adminNome,
    adminEmail: data.adminEmail,
    rgpdContrato: data.rgpdAssinado,
    imtEmDia: data.imtVerificada,
    criadaEm: todayIso(),
  });

  // TODO: redirigir a ROUTES.empresas.detail(id) cuando exista la vista de detalle (P3).
  redirect(ROUTES.empresas.list);
}
