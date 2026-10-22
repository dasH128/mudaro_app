import "server-only";

import { EMPRESAS_MOCK, type EmpresaResumen } from "./mock";

// TODO(supabase): almacén en memoria que simula la base de datos. Se pierde al reiniciar
// el servidor. Sustituir por consultas a Supabase y por la Edge Function `crear-empresa`.

// Se cuelga de globalThis para sobrevivir a la recarga de módulos en desarrollo.
const globalStore = globalThis as unknown as { __mudaroEmpresas?: EmpresaResumen[] };

function db(): EmpresaResumen[] {
  return (globalStore.__mudaroEmpresas ??= [...EMPRESAS_MOCK]);
}

export async function listEmpresas(): Promise<readonly EmpresaResumen[]> {
  return [...db()].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
}

type NuevaEmpresaInput = Pick<
  EmpresaResumen,
  "nome" | "nif" | "regiao" | "adminNome" | "adminEmail" | "rgpdContrato" | "imtEmDia" | "criadaEm"
>;

/** Una empresa nueva nace con convite pendiente: sin invitación aceptada ni pasos de configuración. */
export async function createEmpresa(input: NuevaEmpresaInput): Promise<EmpresaResumen> {
  const empresa: EmpresaResumen = {
    ...input,
    id: crypto.randomUUID(),
    conviteAceite: false,
    passosConfig: 0,
    desativadaEm: null,
  };
  db().push(empresa);
  return empresa;
}
