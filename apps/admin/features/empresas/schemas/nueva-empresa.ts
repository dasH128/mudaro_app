import { z } from "zod";

import { isValidNif } from "@/features/empresas/domain/nif";
import { parseDatePt, todayIso } from "@/app/lib/format";
import { REGIOES_PILOTO } from "@/features/empresas/domain/regioes";

// Reglas de validación: docs/requirement-mvp.md, RF-65.

export const FIELDS = [
  "nome",
  "nif",
  "telefone",
  "emailGeral",
  "morada",
  "adminNome",
  "adminTelemovel",
  "adminEmail",
  "imtVerificada",
  "imtData",
  "imtReferencia",
  "rgpdAssinado",
  "rgpdData",
  "rgpdVersao",
  "regiao",
  "origem",
  "notas",
  "enviarConvite",
] as const;

export type FieldName = (typeof FIELDS)[number];

const CHECKBOXES = ["imtVerificada", "rgpdAssinado", "enviarConvite"] as const;
type CheckboxName = (typeof CHECKBOXES)[number];

export type FormValues = { [K in FieldName]: K extends CheckboxName ? boolean : string };

export const DEFAULT_VALUES: FormValues = {
  nome: "",
  nif: "",
  telefone: "",
  emailGeral: "",
  morada: "",
  adminNome: "",
  adminTelemovel: "",
  adminEmail: "",
  imtVerificada: false,
  imtData: "",
  imtReferencia: "",
  rgpdAssinado: false,
  rgpdData: "",
  rgpdVersao: "",
  regiao: "",
  origem: "",
  notas: "",
  enviarConvite: true,
};

/** Nombre visible de cada campo, para el resumen de errores. */
export const FIELD_LABEL: Record<FieldName, string> = {
  nome: "Nome comercial",
  nif: "NIF",
  telefone: "Telefone",
  emailGeral: "Email geral",
  morada: "Morada da base",
  adminNome: "Nome do administrador",
  adminTelemovel: "Telemóvel do administrador",
  adminEmail: "Email do administrador",
  imtVerificada: "Licença IMT verificada",
  imtData: "Data de verificação IMT",
  imtReferencia: "Referência IMT",
  rgpdAssinado: "Contrato de tratamento de dados",
  rgpdData: "Data de assinatura do contrato",
  rgpdVersao: "Versão do contrato",
  regiao: "Região",
  origem: "Como chegou até nós",
  notas: "Notas internas",
  enviarConvite: "Enviar o convite por email agora",
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
  .refine((v) => v === "" || /^(\+351)?\d{9}$/.test(stripSpaces(v)), "Indique um número com 9 dígitos (ex.: 912 345 678).");

const emailFormat = (v: string) => z.email().safeParse(v).success;

export const nuevaEmpresaSchema = z
  .object({
    nome: requiredText("Indique o nome comercial."),
    nif: z
      .string()
      .trim()
      .min(1, "Indique o NIF.")
      .refine((v) => isValidNif(stripSpaces(v)), "NIF inválido. Confirme os 9 dígitos e o dígito de controlo.")
      .transform(stripSpaces),
    telefone: optionalPhone,
    emailGeral: z.string().trim().refine((v) => v === "" || emailFormat(v), "Indique um email válido."),
    morada: optionalText,
    adminNome: requiredText("Indique o nome do administrador."),
    adminTelemovel: optionalPhone,
    adminEmail: z
      .string()
      .trim()
      .min(1, "Indique o email do administrador.")
      .refine(emailFormat, "Indique um email válido."),
    imtVerificada: z.boolean(),
    imtData: z.string().trim(),
    imtReferencia: optionalText,
    rgpdAssinado: z.boolean(),
    rgpdData: z.string().trim(),
    rgpdVersao: optionalText,
    regiao: z.string().refine((v) => v === "" || REGIOES_PILOTO.includes(v), "Selecione uma região da lista."),
    origem: optionalText,
    notas: z.string().trim().max(2000, "Máximo de 2000 caracteres."),
    enviarConvite: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const dates = [
      { checked: value.imtVerificada, date: value.imtData, path: "imtData" },
      { checked: value.rgpdAssinado, date: value.rgpdData, path: "rgpdData" },
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

export type NuevaEmpresa = z.output<typeof nuevaEmpresaSchema>;

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
