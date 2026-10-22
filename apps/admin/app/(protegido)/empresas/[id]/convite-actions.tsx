"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { controlClass } from "@/app/components/form/fields";
import { regenerateLinkAction, resendInviteAction } from "./actions";
import { IDLE, type ActionState } from "./_state";

type ConviteActionsProps = {
  empresaId: string;
  link: string;
};

export function ConviteActions({ empresaId, link }: ConviteActionsProps) {
  const [resendState, resendAction, resending] = useActionState(resendInviteAction.bind(null, empresaId, null), IDLE);
  const [linkState, linkAction, generating] = useActionState(regenerateLinkAction.bind(null, empresaId), IDLE);

  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso o sin contexto seguro: se deja el texto seleccionado para copiarlo a mano.
      inputRef.current?.select();
    }
  }

  const messages = [resendState, linkState].filter(
    (state): state is Exclude<ActionState, { status: "idle" }> => state.status !== "idle",
  );

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="link" className="text-sm font-bold">
          Link do convite
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id="link"
            type="text"
            readOnly
            value={link}
            className={`${controlClass} h-11 min-w-0 flex-[1_1_260px] border-status-off-border bg-line-soft text-[15px] text-muted`}
          />
          <Button variant="secondary" onClick={copy}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 012-2h10" />
            </svg>
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <span role="status" className="sr-only">
            {copied ? "Link copiado." : ""}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <form action={resendAction}>
          <Button type="submit" disabled={resending}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            {resending ? "A enviar..." : "Reenviar email"}
          </Button>
        </form>
        <form action={linkAction}>
          <Button type="submit" variant="secondary" disabled={generating}>
            {generating ? "A gerar..." : "Gerar novo link"}
          </Button>
        </form>
      </div>

      <div role="status" className="flex flex-col gap-1">
        {messages.map((state, i) => (
          <p
            key={i}
            className={`m-0 text-sm ${state.status === "error" ? "font-medium text-danger-foreground" : "text-muted"}`}
          >
            {state.message}
          </p>
        ))}
      </div>
    </>
  );
}
