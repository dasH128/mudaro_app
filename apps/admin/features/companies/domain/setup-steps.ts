// Pasos obligatorios del asistente de configuración (RF-66). Lógica pura: sin Supabase ni React.

type ProfileInput = {
  address: string | null;
  phone: string | null;
  generalEmail: string | null;
};

const hasText = (value: string | null): boolean => value !== null && value.trim().length > 0;

/**
 * Perfil de la empresa completo: dirección de la base y al menos un contacto (teléfono o email).
 * El nombre y el NIF no cuentan, porque son obligatorios desde el alta.
 * Criterio provisional (RF-02 no lo concreta): confirmarlo con el diseño del asistente.
 */
export function isProfileComplete({ address, phone, generalEmail }: ProfileInput): boolean {
  return hasText(address) && (hasText(phone) || hasText(generalEmail));
}

type SetupStepsInput = {
  /** 1. Cuenta del administrador: ha aceptado el convite. */
  invitationAccepted: boolean;
  /** 2. Perfil de la empresa. */
  profileComplete: boolean;
  /** 3. Al menos un vehículo activo. */
  hasVehicles: boolean;
  /** 4. Tarifa guardada. */
  hasTariff: boolean;
};

/** Pasos completados, de 0 a `TOTAL_STEPS`. */
export function countSetupSteps({ invitationAccepted, profileComplete, hasVehicles, hasTariff }: SetupStepsInput): number {
  return [invitationAccepted, profileComplete, hasVehicles, hasTariff].filter(Boolean).length;
}
