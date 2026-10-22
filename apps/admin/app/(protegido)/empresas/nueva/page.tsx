import type { Metadata } from "next";
import Link from "next/link";

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
        <Link
          href={ROUTES.empresas.list}
          className="inline-flex items-center gap-1.5 self-start py-1.5 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Empresas
        </Link>
        <h1 className="m-0 font-display text-[32px] leading-[1.15] font-extrabold tracking-[-0.02em]">Nova empresa</h1>
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
