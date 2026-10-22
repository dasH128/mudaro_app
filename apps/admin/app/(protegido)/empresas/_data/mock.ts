// TODO(supabase): datos de ejemplo. Sustituir por una consulta a la base de datos
// cuando haya proyecto Supabase conectado. Estos valores son ficticios.

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

const POR = "Equipa Mudaro";

const base = {
  nif: "[NIF]",
  regiao: "[Região]",
  adminNome: "[Nome do administrador]",
  adminEmail: "[email do administrador]",
  telefone: "[telefone]",
  emailGeral: "[email]",
  morada: "[morada]",
  origem: "[origem]",
  notas: "[notas]",
  adminTelemovel: "[telemóvel]",
  imtReferencia: "[referência]",
  rgpdVersao: "v1",
};

const admin = (id: string, convitePendente: boolean, ultimoAcesso: string | null): Utilizador => ({
  id: `${id}-admin`,
  nome: base.adminNome,
  email: base.adminEmail,
  perfil: "Administrador",
  convitePendente,
  ultimoAcesso,
});

const operario = (id: string, n: number, convitePendente: boolean, ultimoAcesso: string | null): Utilizador => ({
  id: `${id}-operario-${n}`,
  nome: `[Operário ${n}]`,
  email: "[email]",
  perfil: "Operário",
  convitePendente,
  ultimoAcesso,
});

const convite = (id: string, enviadoEm: string, validoAte: string): Convite => ({
  enviadoEm,
  validoAte,
  link: `https://app.mudaro.pt/convite/simulado-${id}`,
});

const evento = (id: string, n: number, texto: string, em: string): EventoHistorial => ({
  id: `${id}-evento-${n}`,
  texto,
  por: POR,
  em,
});

export const EMPRESAS_MOCK: readonly EmpresaDetalhe[] = [
  {
    ...base,
    id: "empresa-1",
    nome: "[Empresa piloto 1]",
    conviteAceite: false,
    passosConfig: 0,
    desativadaEm: null,
    rgpdContrato: false,
    imtEmDia: true,
    criadaEm: "2026-10-20",
    imtVerificadaEm: "2026-10-19",
    rgpdAssinadoEm: null,
    convite: convite("empresa-1", "2026-10-20T10:30:00Z", "2026-10-27T10:30:00Z"),
    utilizadores: [admin("empresa-1", true, null)],
    historial: [
      evento("empresa-1", 2, "Convite enviado", "2026-10-20T10:31:00Z"),
      evento("empresa-1", 1, "Empresa criada", "2026-10-20T10:30:00Z"),
    ],
  },
  {
    ...base,
    id: "empresa-2",
    nome: "[Empresa piloto 2]",
    conviteAceite: true,
    passosConfig: 2,
    desativadaEm: null,
    rgpdContrato: true,
    imtEmDia: true,
    criadaEm: "2026-10-14",
    imtVerificadaEm: "2026-10-13",
    rgpdAssinadoEm: "2026-10-14",
    convite: convite("empresa-2", "2026-10-14T09:00:00Z", "2026-10-21T09:00:00Z"),
    utilizadores: [admin("empresa-2", false, "2026-10-15T08:20:00Z")],
    historial: [
      evento("empresa-2", 4, "Administrador entrou pela primeira vez", "2026-10-15T08:20:00Z"),
      evento("empresa-2", 3, "Contrato RGPD registado", "2026-10-14T11:00:00Z"),
      evento("empresa-2", 2, "Convite enviado", "2026-10-14T09:01:00Z"),
      evento("empresa-2", 1, "Empresa criada", "2026-10-14T09:00:00Z"),
    ],
  },
  {
    ...base,
    id: "empresa-3",
    nome: "[Empresa piloto 3]",
    conviteAceite: true,
    passosConfig: 4,
    desativadaEm: null,
    rgpdContrato: true,
    imtEmDia: true,
    criadaEm: "2026-10-05",
    imtVerificadaEm: "2026-10-04",
    rgpdAssinadoEm: "2026-10-05",
    convite: convite("empresa-3", "2026-10-05T09:00:00Z", "2026-10-12T09:00:00Z"),
    utilizadores: [
      admin("empresa-3", false, "2026-10-21T17:45:00Z"),
      operario("empresa-3", 1, false, "2026-10-19T08:10:00Z"),
      operario("empresa-3", 2, true, null),
    ],
    historial: [
      evento("empresa-3", 4, "Empresa ativada", "2026-10-09T15:00:00Z"),
      evento("empresa-3", 3, "Tarifa v1 guardada", "2026-10-09T14:40:00Z"),
      evento("empresa-3", 2, "Administrador entrou pela primeira vez", "2026-10-06T08:15:00Z"),
      evento("empresa-3", 1, "Empresa criada", "2026-10-05T09:00:00Z"),
    ],
  },
  {
    ...base,
    id: "empresa-4",
    nome: "[Empresa piloto 4]",
    conviteAceite: true,
    passosConfig: 4,
    desativadaEm: "2026-10-18",
    rgpdContrato: true,
    imtEmDia: true,
    criadaEm: "2026-09-28",
    imtVerificadaEm: "2026-09-27",
    rgpdAssinadoEm: "2026-09-28",
    convite: convite("empresa-4", "2026-09-28T09:00:00Z", "2026-10-05T09:00:00Z"),
    utilizadores: [
      admin("empresa-4", false, "2026-10-17T16:00:00Z"),
      operario("empresa-4", 1, false, "2026-10-16T08:30:00Z"),
      operario("empresa-4", 2, true, null),
    ],
    historial: [
      evento("empresa-4", 3, "Empresa desativada. Motivo: [motivo]", "2026-10-18T12:00:00Z"),
      evento("empresa-4", 2, "Empresa ativada", "2026-10-02T15:00:00Z"),
      evento("empresa-4", 1, "Empresa criada", "2026-09-28T09:00:00Z"),
    ],
  },
];
