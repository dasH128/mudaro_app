export type PerfilUtilizador = "Administrador" | "Operário";

export type Utilizador = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUtilizador;
  convitePendente: boolean;
  /** Fecha y hora ISO, o null si nunca ha entrado. */
  ultimoAcesso: string | null;
};

export type Convite = {
  /** Fecha y hora ISO del envío, o null si aún no se ha enviado. */
  enviadoEm: string | null;
  validoAte: string;
  link: string;
};

export type EventoHistorial = {
  id: string;
  texto: string;
  por: string;
  /** Fecha y hora ISO. */
  em: string;
};

export type EmpresaResumen = {
  id: string;
  nome: string;
  nif: string;
  regiao: string;
  adminNome: string;
  adminEmail: string;
  conviteAceite: boolean;
  /** Pasos completados del asistente de configuración (0 a 4). */
  passosConfig: number;
  desativadaEm: string | null;
  rgpdContrato: boolean;
  imtEmDia: boolean;
  /** Fecha ISO (aaaa-mm-dd). */
  criadaEm: string;
};

export type EmpresaDetalhe = EmpresaResumen & {
  telefone: string;
  emailGeral: string;
  morada: string;
  origem: string;
  notas: string;
  adminTelemovel: string;
  /** Fecha ISO (aaaa-mm-dd) de la verificación IMT, si se registró. */
  imtVerificadaEm: string | null;
  imtReferencia: string;
  /** Fecha ISO (aaaa-mm-dd) de la firma del contrato RGPD, si se registró. */
  rgpdAssinadoEm: string | null;
  rgpdVersao: string;
  convite: Convite;
  utilizadores: Utilizador[];
  /** Del más reciente al más antiguo. */
  historial: EventoHistorial[];
};
