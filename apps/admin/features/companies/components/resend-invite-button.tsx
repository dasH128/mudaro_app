"use client";

import { useActionState } from "react";

import { Button } from "@/app/components/ui/button";
import { resendInviteAction } from "@/features/companies/actions/invitation";
import { IDLE } from "@/features/companies/actions/state";

type ResendInviteButtonProps = {
  companyId: string;
  userId: string;
  name: string;
};

export function ResendInviteButton({ companyId, userId, name }: ResendInviteButtonProps) {
  const [state, action, pending] = useActionState(resendInviteAction.bind(null, companyId, userId), IDLE);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <Button type="submit" variant="secondary" size="sm" disabled={pending} aria-label={`Reenviar convite: ${name}`}>
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
