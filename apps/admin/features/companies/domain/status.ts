export type CompanyStatus = "invitation" | "setup" | "active" | "deactivated";

export const STATUSES: readonly CompanyStatus[] = ["invitation", "setup", "active", "deactivated"];

export const STATUS_LABEL: Record<CompanyStatus, string> = {
  invitation: "Convite pendente",
  setup: "Em configuração",
  active: "Ativa",
  deactivated: "Desativada",
};

/** Texto de cada tarjeta-filtro (plural donde aplica). */
export const FILTER_LABEL: Record<CompanyStatus, string> = {
  invitation: "Convite pendente",
  setup: "Em configuração",
  active: "Ativas",
  deactivated: "Desativadas",
};

export function isStatus(value: string | undefined): value is CompanyStatus {
  return STATUSES.some((e) => e === value);
}

/** Pasos del asistente de configuración inicial. */
export const TOTAL_STEPS = 4;

type StatusInput = {
  invitationAccepted: boolean;
  setupSteps: number;
  deactivatedAt: string | null;
  gdprContract: boolean;
  imtUpToDate: boolean;
};

/**
 * El estado no se guarda: se calcula a partir de los datos de la empresa (RF-66).
 * Una empresa solo está activa con los 4 pasos obligatorios y con la licencia IMT y el contrato RGPD
 * registrados; sin ellos se queda en configuración, porque no se puede activar.
 */
export function deriveStatus({
  invitationAccepted,
  setupSteps,
  deactivatedAt,
  gdprContract,
  imtUpToDate,
}: StatusInput): CompanyStatus {
  if (deactivatedAt) return "deactivated";
  if (!invitationAccepted) return "invitation";
  if (setupSteps < TOTAL_STEPS || !gdprContract || !imtUpToDate) return "setup";
  return "active";
}
