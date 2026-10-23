"use client";

import { useActionState } from "react";

import { Button } from "@/app/components/ui/button";
import { resendInviteAction } from "@/features/empresas/actions/convite";
import { IDLE } from "@/features/empresas/actions/state";

type ResendInviteButtonProps = {
  empresaId: string;
  userId: string;
  nome: string;
};

export function ResendInviteButton({ empresaId, userId, nome }: ResendInviteButtonProps) {
  const [state, action, pending] = useActionState(resendInviteAction.bind(null, empresaId, userId), IDLE);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <Button type="submit" variant="secondary" size="sm" disabled={pending} aria-label={`Reenviar convite: ${nome}`}>
        {pending ? "A enviar..." : "Reenviar convite"}
      </Button>
      <span
        role="status"
        className={`text-[13px] ${state.status === "error" ? "font-medium text-danger-foreground" : "text-muted"}`}
      >
        {state.status === "idle" ? "" : state.message}
      </span>
    </form>
  );
}
