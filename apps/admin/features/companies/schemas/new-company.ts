import { z } from "zod";

import { isValidPtPhone, isValidTaxId, parseDatePt } from "@mudaro/validation";

import { todayIso } from "@/app/lib/format";
import { REGIONS_PILOT } from "@/features/companies/domain/regions";

// Reglas de validación: docs/requirement-mvp.md, RF-65.

export const FIELDS = [
  "name",
  "taxId",
  "phone",
  "emailGeneral",
  "address",
  "adminName",
  "adminMobile",
  "adminEmail",
  "imtVerified",
  "imtData",
  "imtReference",
  "gdprSigned",
  "gdprData",
  "gdprVersion",
  "region",
  "origin",
  "notes",
  "sendInvitation",
] as const;

export type FieldName = (typeof FIELDS)[number];

const CHECKBOXES = ["imtVerified", "gdprSigned", "sendInvitation"] as const;
type CheckboxName = (typeof CHECKBOXES)[number];

export type FormValues = { [K in FieldName]: K extends CheckboxName ? boolean : string };

export const DEFAULT_VALUES: FormValues = {
  name: "",
  taxId: "",
  phone: "",
  emailGeneral: "",
  address: "",
  adminName: "",
  adminMobile: "",
  adminEmail: "",
  imtVerified: false,
  imtData: "",
  imtReference: "",
  gdprSigned: false,
  gdprData: "",
  gdprVersion: "",
  region: "",
  origin: "",
  notes: "",
  sendInvitation: true,
};

/** Nombre visible de cada campo, para el resumen de errores. */
export const FIELD_LABEL: Record<FieldName, string> = {
  name: "Nome comercial",
  taxId: "NIF",
  phone: "Telefone",
  emailGeneral: "Email geral",
  address: "Morada da base",
  adminName: "Nome do administrador",
  adminMobile: "Telemóvel do administrador",
  adminEmail: "Email do administrador",
  imtVerified: "Licença IMT verificada",
  imtData: "Data de verificação IMT",
  imtReference: "Referência IMT",
  gdprSigned: "Contrato de tratamento de dados",
  gdprData: "Data de assinatura do contrato",
  gdprVersion: "Versão do contrato",
  region: "Região",
  origin: "Como chegou até nós",
  notes: "Notas internas",
  sendInvitation: "Enviar o convite por email agora",
};

export type FormState =
  | { status: "idle" }
  | { status: "error"; fieldErrors: Partial<Record<FieldName, string>>; values: FormValues };

const stripSpaces = (value: string) => value.replace(/\s+/g, "");

const requiredText = (message: string) =>
  z.string().trim().min(1, message).max(200, "Máximo de 200 caracteres.");

const optionalText = z.string().trim().max(200, "Máximo de 200 caracteres.");

const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || isValidPtPhone(v), "Indique um número com 9 dígitos (ex.: 912 345 678).");

const emailFormat = (v: string) => z.email().safeParse(v).success;

export const newCompanySchema = z
  .object({
    name: requiredText("Indique o nome comercial."),
    taxId: z
      .string()
      .trim()
      .min(1, "Indique o NIF.")
      .refine((v) => isValidTaxId(stripSpaces(v)), "NIF inválido. Confirme os 9 dígitos e o dígito de controlo.")
      .transform(stripSpaces),
    phone: optionalPhone,
    emailGeneral: z.string().trim().refine((v) => v === "" || emailFormat(v), "Indique um email válido."),
    address: optionalText,
    adminName: requiredText("Indique o nome do administrador."),
    adminMobile: optionalPhone,
    adminEmail: z
      .string()
      .trim()
      .min(1, "Indique o email do administrador.")
      .refine(emailFormat, "Indique um email válido."),
    imtVerified: z.boolean(),
    imtData: z.string().trim(),
    imtReference: optionalText,
    gdprSigned: z.boolean(),
    gdprData: z.string().trim(),
    gdprVersion: optionalText,
    region: z.string().refine((v) => v === "" || REGIONS_PILOT.includes(v), "Selecione uma região da lista."),
    origin: optionalText,
    notes: z.string().trim().max(2000, "Máximo de 2000 caracteres."),
    sendInvitation: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const dates = [
      { checked: value.imtVerified, date: value.imtData, path: "imtData" },
      { checked: value.gdprSigned, date: value.gdprData, path: "gdprData" },
    ] as const;

    for (const { checked, date, path } of dates) {
      if (date === "") {
        if (checked) ctx.addIssue({ code: "custom", path: [path], message: "Indique a data (dd/mm/aaaa)." });
        continue;
      }
      const iso = parseDatePt(date);
      if (!iso) {
        ctx.addIssue({ code: "custom", path: [path], message: "Data inválida. Use o formato dd/mm/aaaa." });
      } else if (iso > todayIso()) {
        ctx.addIssue({ code: "custom", path: [path], message: "A data não pode ser futura." });
      }
    }
  });

export type NewCompany = z.output<typeof newCompanySchema>;

/** Lee el FormData tal cual llega: texto o casilla marcada ("on"). */
export function readValues(formData: FormData): FormValues {
  const values: Record<string, string | boolean> = {};
  for (const field of FIELDS) {
    const raw = formData.get(field);
    values[field] = (CHECKBOXES as readonly string[]).includes(field) ? raw === "on" : typeof raw === "string" ? raw : "";
  }
  return values as FormValues;
}

/** Primer mensaje de cada campo. */
export function toFieldErrors(error: z.ZodError): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && (FIELDS as readonly string[]).includes(field)) {
      errors[field as FieldName] ??= issue.message;
    }
  }
  return errors;
}
