export type EstadoEmpresa = "convite" | "config" | "ativa" | "off";

export const ESTADOS: readonly EstadoEmpresa[] = ["convite", "config", "ativa", "off"];

export const ESTADO_LABEL: Record<EstadoEmpresa, string> = {
  convite: "Convite pendente",
  config: "Em configuração",
  ativa: "Ativa",
  off: "Desativada",
};

/** Texto de cada tarjeta-filtro (plural donde aplica). */
export const FILTER_LABEL: Record<EstadoEmpresa, string> = {
  convite: "Convite pendente",
  config: "Em configuração",
  ativa: "Ativas",
  off: "Desativadas",
};

export function isEstado(value: string | undefined): value is EstadoEmpresa {
  return ESTADOS.some((e) => e === value);
}

/** Pasos del asistente de configuración inicial. */
export const TOTAL_PASSOS = 4;

type EstadoInput = {
  conviteAceite: boolean;
  passosConfig: number;
  desativadaEm: string | null;
};

/** El estado no se guarda: se calcula a partir de los datos de la empresa. */
export function deriveEstado({ conviteAceite, passosConfig, desativadaEm }: EstadoInput): EstadoEmpresa {
  if (desativadaEm) return "off";
  if (!conviteAceite) return "convite";
  if (passosConfig < TOTAL_PASSOS) return "config";
  return "ativa";
}
