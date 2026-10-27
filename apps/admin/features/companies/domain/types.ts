export type UserProfile = "administrator" | "operator";

/** Texto que muestra la interfaz (portugués de Portugal). El dominio solo guarda el código. */
export const PROFILE_LABEL: Record<UserProfile, string> = {
  administrator: "Administrador",
  operator: "Operário",
};

export type User = {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
  invitationPending: boolean;
  /** Fecha y hora ISO, o null si nunca ha entrado. */
  lastAccess: string | null;
};

export type Invitation = {
  /** Fecha y hora ISO del envío, o null si aún no se ha enviado. */
  sentAt: string | null;
  validUntil: string;
  /** Enlace en claro. Solo existe justo después de generarlo; de una lectura normal viene null. */
  link: string | null;
};

/** Acciones del histórico. Equivalen a los códigos que se guardarán en `audit_log.action`. */
export type HistoryAction =
  | "company_created"
  | "company_activated"
  | "company_deactivated"
  | "company_reactivated"
  | "invitation_sent"
  | "invitation_resent"
  | "invitation_link_regenerated"
  | "admin_first_login"
  | "gdpr_contract_registered"
  | "tariff_saved";

export type HistoryEvent = {
  id: string;
  action: HistoryAction;
  /** Dato que completa la acción: el motivo, el email o la versión. */
  detail: string | null;
  by: string;
  /** Fecha y hora ISO. */
  at: string;
};

export type CompanySummary = {
  id: string;
  name: string;
  taxId: string;
  region: string;
  adminName: string;
  adminEmail: string;
  invitationAccepted: boolean;
  /** Pasos completados del asistente de configuración (0 a 4). */
  setupSteps: number;
  deactivatedAt: string | null;
  gdprContract: boolean;
  imtUpToDate: boolean;
  /** Fecha ISO (aaaa-mm-dd). */
  createdAt: string;
};

export type CompanyDetail = CompanySummary & {
  phone: string;
  emailGeneral: string;
  address: string;
  origin: string;
  notes: string;
  adminMobile: string;
  /** Fecha ISO (aaaa-mm-dd) de la verificación IMT, si se registró. */
  imtVerifiedAt: string | null;
  imtReference: string;
  /** Fecha ISO (aaaa-mm-dd) de la firma del contrato RGPD, si se registró. */
  gdprSignedAt: string | null;
  gdprVersion: string;
  /** Convite vigente do administrador, o null si no hay ninguno. */
  invitation: Invitation | null;
  users: User[];
  /** Del más reciente al más antiguo. */
  history: HistoryEvent[];
};
