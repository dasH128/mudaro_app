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
  rgpdContrato: boolean;
  imtEmDia: boolean;
};

/**
 * El estado no se guarda: se calcula a partir de los datos de la empresa (RF-66).
 * Una empresa solo está activa con los 4 pasos obligatorios y con la licencia IMT y el contrato RGPD
 * registrados; sin ellos se queda en configuración, porque no se puede activar.
 */
export function deriveEstado({
  conviteAceite,
  passosConfig,
  desativadaEm,
  rgpdContrato,
  imtEmDia,
}: EstadoInput): EstadoEmpresa {
  if (desativadaEm) return "off";
  if (!conviteAceite) return "convite";
  if (passosConfig < TOTAL_PASSOS || !rgpdContrato || !imtEmDia) return "config";
  return "ativa";
}
