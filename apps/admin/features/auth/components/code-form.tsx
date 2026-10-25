"use client";

import { useActionState } from "react";

import { PageTitle } from "@/app/components/page-title";
import { Button, ButtonLink } from "@/app/components/ui/button";
import { ROUTES } from "@/app/lib/routes";
import { IDLE } from "@/features/auth/actions/state";
import { verifyCodeAction } from "@/features/auth/actions/verify-code";

import { ErrorAlert } from "./error-alert";
import { OtpField } from "./otp-field";

export function CodeForm() {
  const [state, formAction, pending] = useActionState(verifyCodeAction, IDLE);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div
        aria-hidden="true"
        className="flex size-[52px] items-center justify-center rounded-[14px] border border-on-ink bg-surface"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <PageTitle>Verificação em dois passos</PageTitle>
        <p className="m-0 text-[15px] leading-[1.5] text-muted">
          Introduza o código de 6 dígitos da sua aplicação de autenticação.
        </p>
      </div>

      {state.status === "error" && <ErrorAlert>{state.message}</ErrorAlert>}

      <OtpField />

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "A verificar…" : "Entrar"}
      </Button>
      <ButtonLink href={ROUTES.login} variant="text" className="self-center">
        Voltar
      </ButtonLink>
    </form>
  );
}
