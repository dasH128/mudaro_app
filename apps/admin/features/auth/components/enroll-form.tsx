"use client";

import { useActionState } from "react";

import { PageTitle } from "@/app/components/page-title";
import { Button, ButtonLink } from "@/app/components/ui/button";
import { ROUTES } from "@/app/lib/routes";
import { confirmEnrollmentAction, startEnrollmentAction } from "@/features/auth/actions/enroll";
import { IDLE, IDLE_ENROLL } from "@/features/auth/actions/state";

import { ErrorAlert } from "./error-alert";
import { OtpField } from "./otp-field";

// Primer acceso: el usuario activa su app de autenticación. Hasta confirmar el primer código
// no hay MFA, y sin MFA el panel no deja pasar (`is_platform_user()` exige aal2).
export function EnrollForm() {
  const [startState, startAction, starting] = useActionState(startEnrollmentAction, IDLE_ENROLL);
  const [confirmState, confirmAction, confirming] = useActionState(confirmEnrollmentAction, IDLE);

  if (startState.status !== "enrolling") {
    return (
      <form action={startAction} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <PageTitle>Ativar verificação em dois passos</PageTitle>
          <p className="m-0 text-[15px] leading-[1.5] text-muted">
            Para aceder ao painel precisa de uma aplicação de autenticação, por exemplo Google Authenticator,
            Microsoft Authenticator ou 1Password.
          </p>
        </div>

        {startState.status === "error" && <ErrorAlert>{startState.message}</ErrorAlert>}

        <Button type="submit" size="lg" fullWidth disabled={starting}>
          {starting ? "A preparar…" : "Começar"}
        </Button>
        <ButtonLink href={ROUTES.login} variant="text" className="self-center">
          Voltar
        </ButtonLink>
      </form>
    );
  }

  return (
    <form action={confirmAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <PageTitle>Leia o código QR</PageTitle>
        <p className="m-0 text-[15px] leading-[1.5] text-muted">
          Leia o código com a aplicação e introduza o código de 6 dígitos que ela mostra.
        </p>
      </div>

      {/* El QR llega como data URI SVG generada por Supabase: next/image no aporta nada aquí. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={startState.qrCode}
        alt="Código QR para a aplicação de autenticação"
        width={192}
        height={192}
        className="self-center rounded-xl border border-field-border bg-white p-2"
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] leading-[1.4] text-muted">Ou introduza este código manualmente:</span>
        <code className="rounded-[10px] border border-field-border bg-surface px-3 py-2 text-sm break-all">
          {startState.secret}
        </code>
      </div>

      <input type="hidden" name="factorId" value={startState.factorId} />

      {confirmState.status === "error" && <ErrorAlert>{confirmState.message}</ErrorAlert>}

      <OtpField />

      <Button type="submit" size="lg" fullWidth disabled={confirming}>
        {confirming ? "A verificar…" : "Ativar e entrar"}
      </Button>
    </form>
  );
}
