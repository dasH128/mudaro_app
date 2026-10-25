"use server";

import { redirect } from "next/navigation";

import { requirePlatformUser } from "@/app/lib/auth";
import { parseDatePt } from "@/app/lib/format";
import { ROUTES } from "@/app/lib/routes";
import { createCompany } from "@/features/companies/data/companies.repo";
import { newCompanySchema, readValues, toFieldErrors, type FormState } from "@/features/companies/schemas/new-company";

// RF-65: alta de empresa desde el panel interno.
export async function createCompanyAction(_previous: FormState, formData: FormData): Promise<FormState> {
  // La autorización no se delega en el proxy ni en el layout: se comprueba también aquí.
  const user = await requirePlatformUser();

  const values = readValues(formData);
  const parsed = newCompanySchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const { data } = parsed;

  // TODO(supabase): llamar a la Edge Function `crear-empresa`, que valida el rol de plataforma,
  // crea la empresa e invita al administrador (solo si data.enviarConvite). Por ahora se simula en memoria.
  const company = await createCompany({
    name: data.name,
    taxId: data.taxId,
    region: data.region,
    phone: data.phone,
    emailGeneral: data.emailGeneral,
    address: data.address,
    origin: data.origin,
    notes: data.notes,
    adminName: data.adminName,
    adminEmail: data.adminEmail,
    adminMobile: data.adminMobile,
    imtVerified: data.imtVerified,
    imtVerifiedAt: parseDatePt(data.imtData),
    imtReference: data.imtReference,
    gdprSigned: data.gdprSigned,
    gdprSignedAt: parseDatePt(data.gdprData),
    gdprVersion: data.gdprVersion,
    sendInvitation: data.sendInvitation,
    createdBy: user.name,
  });

  redirect(ROUTES.companies.detail(company.id, { created: true }));
}
