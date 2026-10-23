"use server";

import { redirect } from "next/navigation";

import { requirePlatformUser } from "@/app/lib/auth";
import { parseDatePt } from "@/app/lib/format";
import { ROUTES } from "@/app/lib/routes";
import { createEmpresa } from "@/features/empresas/data/empresas.repo";
import { nuevaEmpresaSchema, readValues, toFieldErrors, type FormState } from "@/features/empresas/schemas/nueva-empresa";

// RF-65: alta de empresa desde el panel interno.
export async function createEmpresaAction(_previous: FormState, formData: FormData): Promise<FormState> {
  // La autorización no se delega en el proxy ni en el layout: se comprueba también aquí.
  const user = await requirePlatformUser();

  const values = readValues(formData);
  const parsed = nuevaEmpresaSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const { data } = parsed;

  // TODO(supabase): llamar a la Edge Function `crear-empresa`, que valida el rol de plataforma,
  // crea la empresa e invita al administrador (solo si data.enviarConvite). Por ahora se simula en memoria.
  const empresa = await createEmpresa({
    nome: data.nome,
    nif: data.nif,
    regiao: data.regiao,
    telefone: data.telefone,
    emailGeral: data.emailGeral,
    morada: data.morada,
    origem: data.origem,
    notas: data.notas,
    adminNome: data.adminNome,
    adminEmail: data.adminEmail,
    adminTelemovel: data.adminTelemovel,
    imtVerificada: data.imtVerificada,
    imtVerificadaEm: parseDatePt(data.imtData),
    imtReferencia: data.imtReferencia,
    rgpdAssinado: data.rgpdAssinado,
    rgpdAssinadoEm: parseDatePt(data.rgpdData),
    rgpdVersao: data.rgpdVersao,
    enviarConvite: data.enviarConvite,
    criadaPor: user.name,
  });

  redirect(ROUTES.empresas.detail(empresa.id, { created: true }));
}
