import "server-only";

import { todayIso } from "@/app/lib/format";
import type { EmpresaDetalhe, EmpresaResumen, EventoHistorial } from "../domain/types";
import { EMPRESAS_MOCK } from "./mock";

// TODO(supabase): almacén en memoria que simula la base de datos. Se pierde al reiniciar
// el servidor. Sustituir por consultas a Supabase y por las Edge Functions (`crear-empresa`, etc.).

/** Validez del convite. Valor provisional: confirmar con la configuración de Supabase Auth. */
export const CONVITE_VALIDADE_DIAS = 7;

// Se cuelga de globalThis para sobrevivir a la recarga de módulos en desarrollo.
const globalStore = globalThis as unknown as { __mudaroEmpresas?: EmpresaDetalhe[] };

function db(): EmpresaDetalhe[] {
  return (globalStore.__mudaroEmpresas ??= EMPRESAS_MOCK.map((empresa) => structuredClone(empresa)));
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

// TODO(supabase): el link real lo genera Supabase Auth al invitar al administrador.
function newInviteLink(): string {
  return `https://app.mudaro.pt/convite/simulado-${crypto.randomUUID()}`;
}

function newEvento(texto: string, por: string): EventoHistorial {
  return { id: crypto.randomUUID(), texto, por, em: new Date().toISOString() };
}

function find(id: string): EmpresaDetalhe | undefined {
  return db().find((empresa) => empresa.id === id);
}

export async function listEmpresas(): Promise<readonly EmpresaResumen[]> {
  return [...db()].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
}

export async function getEmpresa(id: string): Promise<EmpresaDetalhe | undefined> {
  return find(id);
}

export type CreateEmpresaInput = {
  nome: string;
  nif: string;
  regiao: string;
  telefone: string;
  emailGeral: string;
  morada: string;
  origem: string;
  notas: string;
  adminNome: string;
  adminEmail: string;
  adminTelemovel: string;
  imtVerificada: boolean;
  /** Fecha ISO (aaaa-mm-dd) o null. */
  imtVerificadaEm: string | null;
  imtReferencia: string;
  rgpdAssinado: boolean;
  rgpdAssinadoEm: string | null;
  rgpdVersao: string;
  enviarConvite: boolean;
  criadaPor: string;
};

/** Una empresa nueva nace con convite pendiente: sin invitación aceptada ni pasos de configuración. */
export async function createEmpresa(input: CreateEmpresaInput): Promise<EmpresaDetalhe> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const historial: EventoHistorial[] = [newEvento("Empresa criada", input.criadaPor)];
  if (input.enviarConvite) historial.unshift(newEvento("Convite enviado", input.criadaPor));

  const empresa: EmpresaDetalhe = {
    id,
    nome: input.nome,
    nif: input.nif,
    regiao: input.regiao,
    adminNome: input.adminNome,
    adminEmail: input.adminEmail,
    conviteAceite: false,
    passosConfig: 0,
    desativadaEm: null,
    rgpdContrato: input.rgpdAssinado,
    imtEmDia: input.imtVerificada,
    criadaEm: todayIso(),
    telefone: input.telefone,
    emailGeral: input.emailGeral,
    morada: input.morada,
    origem: input.origem,
    notas: input.notas,
    adminTelemovel: input.adminTelemovel,
    imtVerificadaEm: input.imtVerificadaEm,
    imtReferencia: input.imtReferencia,
    rgpdAssinadoEm: input.rgpdAssinadoEm,
    rgpdVersao: input.rgpdVersao,
    convite: {
      enviadoEm: input.enviarConvite ? now : null,
      validoAte: addDays(now, CONVITE_VALIDADE_DIAS),
      link: newInviteLink(),
    },
    utilizadores: [
      {
        id: `${id}-admin`,
        nome: input.adminNome,
        email: input.adminEmail,
        perfil: "Administrador",
        convitePendente: true,
        ultimoAcesso: null,
      },
    ],
    historial,
  };
  db().push(empresa);
  return empresa;
}

/** Reenvía el convite a un utilizador (por defecto, al administrador). */
export async function resendInvite(
  empresaId: string,
  userId: string | null,
  por: string,
): Promise<Result<{ email: string }>> {
  const empresa = find(empresaId);
  if (!empresa) return fail("Empresa não encontrada.");
  if (empresa.desativadaEm) return fail("Reative a empresa antes de reenviar convites.");

  const user = userId
    ? empresa.utilizadores.find((u) => u.id === userId)
    : empresa.utilizadores.find((u) => u.perfil === "Administrador");
  if (!user) return fail("Utilizador não encontrado.");
  if (!user.convitePendente) return fail("Este utilizador já não tem um convite pendente.");

  // El convite de la empresa es el del administrador.
  if (user.perfil === "Administrador") {
    const now = new Date().toISOString();
    empresa.convite.enviadoEm = now;
    empresa.convite.validoAte = addDays(now, CONVITE_VALIDADE_DIAS);
  }
  empresa.historial.unshift(newEvento(`Convite reenviado para ${user.email}`, por));
  return { ok: true, value: { email: user.email } };
}

/** Genera un link nuevo para el convite del administrador. */
export async function regenerateInviteLink(empresaId: string, por: string): Promise<Result<null>> {
  const empresa = find(empresaId);
  if (!empresa) return fail("Empresa não encontrada.");
  if (empresa.conviteAceite) return fail("O administrador já aceitou o convite.");
  if (empresa.desativadaEm) return fail("Reative a empresa antes de gerar um novo link.");

  empresa.convite.link = newInviteLink();
  empresa.convite.validoAte = addDays(new Date().toISOString(), CONVITE_VALIDADE_DIAS);
  empresa.historial.unshift(newEvento("Novo link do convite gerado", por));
  return { ok: true, value: null };
}

/** Desactiva o reactiva la empresa. El motivo es obligatorio al desactivar (lo valida la acción). */
export async function changeEstado(
  empresaId: string,
  desativar: boolean,
  motivo: string,
  por: string,
): Promise<Result<null>> {
  const empresa = find(empresaId);
  if (!empresa) return fail("Empresa não encontrada.");

  if (desativar) {
    if (empresa.desativadaEm) return fail("A empresa já está desativada.");
    empresa.desativadaEm = todayIso();
    empresa.historial.unshift(newEvento(`Empresa desativada. Motivo: ${motivo}`, por));
  } else {
    if (!empresa.desativadaEm) return fail("A empresa já está ativa.");
    empresa.desativadaEm = null;
    empresa.historial.unshift(newEvento("Empresa reativada", por));
  }
  return { ok: true, value: null };
}
