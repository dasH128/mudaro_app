import Link from "next/link";

import { formatDate } from "@/app/lib/format";
import { StatusPill } from "@/app/components/ui/status-pill";
import { ROUTES } from "@/app/lib/routes";
import type { CompanyRow } from "@/features/companies/domain/filters";
import { StatusBadge } from "./status-badge";
import { ProgressBar } from "./progress-bar";

const thClass = "border-b border-line px-5 py-3.5 font-bold";
const tdClass = "border-b border-line-soft px-5 py-3.5";

function Documentation({ row }: { row: CompanyRow }) {
  if (row.gdprContract && row.imtUpToDate) {
    return <span className="text-sm text-muted">IMT e RGPD em dia</span>;
  }
  const missing = !row.gdprContract ? "Falta contrato RGPD" : "Falta documentação IMT";
  return <StatusPill tone="warn">{missing}</StatusPill>;
}

export function CompaniesTable({ rows }: { rows: CompanyRow[] }) {
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
                    href={ROUTES.companies.detail(row.id)}
                    className="font-bold text-foreground no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  >
                    {row.name}
                  </Link>
                  <div className="text-[13px] text-muted">
                    NIF {row.taxId}
                    {row.region && ` · ${row.region}`}
                  </div>
                </td>
                <td className={tdClass}>
                  {row.adminName}
                  <div className="text-[13px] text-muted">{row.adminEmail}</div>
                </td>
                <td className={tdClass}>
                  <StatusBadge status={row.status} />
                </td>
                <td className={tdClass}>
                  <ProgressBar done={row.setupSteps} />
                </td>
                <td className={tdClass}>
                  <Documentation row={row} />
                </td>
                <td className={`${tdClass} text-muted`}>{formatDate(row.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
