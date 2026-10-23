import { deriveEstado, type EstadoEmpresa } from "./estado";
import type { EmpresaResumen } from "./types";

export type EmpresaRow = EmpresaResumen & { estado: EstadoEmpresa };

export function withEstado(empresas: readonly EmpresaResumen[]): EmpresaRow[] {
  return empresas.map((e) => ({ ...e, estado: deriveEstado(e) }));
}

/** Minúsculas y sin acentos, para que "configuracao" encuentre "configuração". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function filterEmpresas(rows: EmpresaRow[], estado: EstadoEmpresa | undefined, q: string): EmpresaRow[] {
  const needle = normalize(q.trim());
  return rows.filter((row) => {
    if (estado && row.estado !== estado) return false;
    if (!needle) return true;
    return [row.nome, row.nif, row.adminNome, row.adminEmail].some((field) => normalize(field).includes(needle));
  });
}

export function countByEstado(rows: EmpresaRow[]): Record<EstadoEmpresa, number> {
  const counts: Record<EstadoEmpresa, number> = { convite: 0, config: 0, ativa: 0, off: 0 };
  for (const row of rows) counts[row.estado] += 1;
  return counts;
}
