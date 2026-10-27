"use client";

import { useActionState } from "react";

import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { confirmInvitationAction } from "@/features/auth/actions/confirm-invitation";
import { IDLE, type ConfirmInvitationState } from "@/features/auth/actions/state";

type ConfirmFormProps = {
  lang: Locale;
  tokenHash: string;
  t: Dictionary["auth"]["confirm"];
};

export function ConfirmForm({ lang, tokenHash, t }: ConfirmFormProps) {
  const [state, formAction, pending] = useActionState<ConfirmInvitationState, FormData>(
    confirmInvitationAction,
    IDLE,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="token_hash" value={tokenHash} />

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm font-medium text-danger-foreground"
        >
          {t.errors[state.code]}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 disabled:opacity-60"
      >
        {pending ? t.accepting : t.accept}
      </button>
    </form>
  );
}
