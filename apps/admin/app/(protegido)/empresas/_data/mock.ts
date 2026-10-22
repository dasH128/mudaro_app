// TODO(supabase): datos de ejemplo. Sustituir por una consulta a la base de datos
// cuando haya proyecto Supabase conectado. Estos valores son ficticios.

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

const base = {
  nif: "[NIF]",
  regiao: "[Região]",
  adminNome: "[Nome do administrador]",
  adminEmail: "[email]",
};

export const EMPRESAS_MOCK: readonly EmpresaResumen[] = [
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
  },
];
