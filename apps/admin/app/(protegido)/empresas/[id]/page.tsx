import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/app/components/back-link";
import { PageTitle } from "@/app/components/page-title";
import { Button } from "@/app/components/ui/button";
import { CREATED_PARAM, ROUTES } from "@/app/lib/routes";
import { deriveEstado } from "../_data/estado";
import { getEmpresa } from "../_data/store";
import { EstadoBadge } from "../estado-badge";
import { ConfiguracaoCard } from "./configuracao-card";
import { ConviteCard } from "./convite-card";
import { DadosCard } from "./dados-card";
import { DocumentosCard } from "./documentos-card";
import { EstadoDialog } from "./estado-dialog";
import { HistoricoCard } from "./historico-card";
import { UtilizadoresCard } from "./utilizadores-card";

export const metadata: Metadata = {
  title: "Painel Mudaro · Detalhe da empresa",
};

export default async function EmpresaDetailPage({ params, searchParams }: PageProps<"/empresas/[id]">) {
  const { id } = await params;
  const empresa = await getEmpresa(id);
  if (!empresa) notFound();

  const query = await searchParams;
  const justCreated = query[CREATED_PARAM] === "1";

  const estado = deriveEstado(empresa);
  const desativada = estado === "off";
  const conviteEnviado = empresa.convite.enviadoEm !== null;
  const mostrarConvite = !empresa.conviteAceite && !desativada;

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-7">
      {justCreated && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-[14px] bg-foreground px-[18px] py-3.5 text-[15px] text-background"
        >
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
          {conviteEnviado ? (
            <span>
              Empresa criada. Enviámos o convite para <strong>{empresa.adminEmail}</strong>.
            </span>
          ) : (
            <span>Empresa criada. O convite ainda não foi enviado: copie o link abaixo ou reenvie o email.</span>
          )}
        </div>
      )}

      {desativada && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-[14px] border border-status-off-border bg-line-soft px-[18px] py-3.5 text-[15px]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 018 0v4" />
          </svg>
          <span>Empresa desativada. Os utilizadores desta empresa não conseguem entrar na app até a reativar.</span>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <BackLink href={ROUTES.empresas.list}>Empresas</BackLink>
          <PageTitle>{empresa.nome}</PageTitle>
          <div className="flex flex-wrap items-center gap-2.5">
            <EstadoBadge estado={estado} />
            <span className="text-sm text-muted">
              NIF {empresa.nif}
              {empresa.regiao && ` · ${empresa.regiao}`}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Sin diseño de flujo todavía: se muestra inerte. */}
          <Button variant="secondary" disabled title="Em breve" aria-label="Editar dados (em breve)">
            Editar dados
          </Button>
          <EstadoDialog empresaId={empresa.id} desativar={!desativada} />
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          {mostrarConvite && <ConviteCard empresaId={empresa.id} convite={empresa.convite} />}
          <UtilizadoresCard
            empresaId={empresa.id}
            utilizadores={empresa.utilizadores}
            empresaDesativada={desativada}
          />
          <ConfiguracaoCard passosConfig={empresa.passosConfig} />
        </div>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <DocumentosCard empresa={empresa} />
          <DadosCard empresa={empresa} />
          <HistoricoCard historial={empresa.historial} />
        </div>
      </div>
    </div>
  );
}
