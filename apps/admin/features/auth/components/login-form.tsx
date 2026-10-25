"use client";

import { useActionState } from "react";

import { TextField } from "@/app/components/form/fields";
import { PageTitle } from "@/app/components/page-title";
import { Button } from "@/app/components/ui/button";
import { signInAction } from "@/features/auth/actions/sign-in";
import { IDLE } from "@/features/auth/actions/state";

import { ErrorAlert } from "./error-alert";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, IDLE);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <PageTitle>Entrar</PageTitle>
        <p className="m-0 text-[15px] text-muted">Use a sua conta da equipa Mudaro.</p>
      </div>

      {state.status === "error" && <ErrorAlert>{state.message}</ErrorAlert>}

      <TextField
        name="email"
        label="Email"
        type="email"
        required
        requiredMark={false}
        autoComplete="username"
        placeholder="nome@mudaro.pt"
        defaultValue={state.status === "error" ? state.email : undefined}
      />
      <TextField
        name="password"
        label="Palavra-passe"
        type="password"
        required
        requiredMark={false}
        autoComplete="current-password"
        placeholder="A sua palavra-passe"
      />

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "A entrar…" : "Continuar"}
      </Button>
    </form>
  );
}
