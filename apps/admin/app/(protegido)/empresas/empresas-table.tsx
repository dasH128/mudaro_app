import Link from "next/link";

import { formatDate } from "@/app/lib/format";
import { ROUTES } from "@/app/lib/routes";
import type { EmpresaRow } from "./_data/query";
import { EstadoBadge } from "./estado-badge";
import { ProgressBar } from "./progress-bar";

const thClass = "border-b border-line px-5 py-3.5 font-bold";
const tdClass = "border-b border-line-soft px-5 py-3.5";

function Documentacao({ row }: { row: EmpresaRow }) {
  if (row.rgpdContrato && row.imtEmDia) {
    return <span className="text-sm text-muted">IMT e RGPD em dia</span>;
  }
  const missing = !row.rgpdContrato ? "Falta contrato RGPD" : "Falta documentação IMT";
  return (
    <span className="inline-block rounded-full border border-warn-border bg-warn-surface px-2.5 py-1 text-[13px] font-bold text-warn-foreground">
      {missing}
    </span>
  );
}

export function EmpresasTable({ rows }: { rows: EmpresaRow[] }) {
  return (
    // Región enfocable: la tabla hace scroll horizontal en pantallas estrechas.
    <div
      role="region"
      aria-label="Lista de empresas"
      tabIndex={0}
      className="overflow-x-auto rounded-2xl border border-line bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <table className="w-full min-w-[900px] border-collapse text-[15px]">
        <caption className="sr-only">Empresas do piloto</caption>
        <thead>
          <tr className="text-left text-[13px] text-muted">
            <th scope="col" className={thClass}>Empresa</th>
            <th scope="col" className={thClass}>Administrador</th>
            <th scope="col" className={thClass}>Estado</th>
            <th scope="col" className={thClass}>Configuração</th>
            <th scope="col" className={thClass}>Documentação</th>
            <th scope="col" className={thClass}>Criada em</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className={`${tdClass} py-10 text-center text-muted`}>
                Nenhuma empresa encontrada.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className={tdClass}>
                  <Link
                    href={ROUTES.empresas.detail(row.id)}
                    className="font-bold text-foreground no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  >
                    {row.nome}
                  </Link>
                  <div className="text-[13px] text-muted">
                    NIF {row.nif}
                    {row.regiao && ` · ${row.regiao}`}
                  </div>
                </td>
                <td className={tdClass}>
                  {row.adminNome}
                  <div className="text-[13px] text-muted">{row.adminEmail}</div>
                </td>
                <td className={tdClass}>
                  <EstadoBadge estado={row.estado} />
                </td>
                <td className={tdClass}>
                  <ProgressBar done={row.passosConfig} />
                </td>
                <td className={tdClass}>
                  <Documentacao row={row} />
                </td>
                <td className={`${tdClass} text-muted`}>{formatDate(row.criadaEm)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
