import type { Metadata } from "next";

import { BackLink } from "@/app/components/back-link";
import { PageTitle } from "@/app/components/page-title";
import { ROUTES } from "@/app/lib/routes";
import { NextSteps } from "./next-steps";
import { NuevaEmpresaForm } from "./nueva-empresa-form";

export const metadata: Metadata = {
  title: "Painel Mudaro · Nova empresa",
};

export default function NuevaEmpresaPage() {
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <BackLink href={ROUTES.empresas.list}>Empresas</BackLink>
        <PageTitle>Nova empresa</PageTitle>
        <p className="m-0 text-[15px] text-muted">
          Registe a empresa que o contactou. O administrador recebe um convite para criar a conta.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <NuevaEmpresaForm />
        <NextSteps />
      </div>
    </div>
  );
}
