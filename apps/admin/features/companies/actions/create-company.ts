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

  // La Edge Function `create-company` valida el rol, crea la empresa y envía el convite si se pidió.
  const result = await createCompany({
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

  if (!result.ok) {
    if (result.code === "tax_id_taken") {
      return { status: "error", fieldErrors: { taxId: "Já existe uma empresa com este NIF." }, values };
    }
    if (result.code === "unauthorized") redirect(ROUTES.login);
    // Error inesperado: lo recoge error.tsx de la carpeta companies.
    throw new Error(`create-company failed: ${result.code}`);
  }

  // Si el convite falló, la ficha lo muestra como pendiente y se puede reenviar desde ahí.
  redirect(ROUTES.companies.detail(result.companyId, { created: true }));
}
