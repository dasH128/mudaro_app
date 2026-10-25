export type UserProfile = "Administrador" | "Operário";

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
  link: string;
};

export type HistoryEvent = {
  id: string;
  text: string;
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
  invitation: Invitation;
  users: User[];
  /** Del más reciente al más antiguo. */
  history: HistoryEvent[];
};
