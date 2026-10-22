"use client";

import { useEffect, useRef, useState } from "react";

import { TextField } from "@/app/components/form/fields";
import { PageTitle } from "@/app/components/page-title";
import { Button } from "@/app/components/ui/button";

type Step = "credentials" | "code";

type LoginFormProps = {
  /** Muestra el aviso de credenciales incorrectas. Lo activará la Server Action de login. */
  hasError?: boolean;
};

export function LoginForm({ hasError = false }: LoginFormProps) {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  // Al cambiar de paso el foco pasa al primer campo, para teclado y lectores de pantalla.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    (step === "code" ? codeRef : emailRef).current?.focus();
  }, [step]);

  if (step === "code") {
    return (
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          // TODO(login): verificar el código TOTP con una Server Action (Supabase Auth MFA)
          // y redirigir a /empresas cuando exista.
        }}
      >
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

        <TextField
          inputRef={codeRef}
          name="otp"
          label="Código"
          required
          requiredMark={false}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder="000000"
          sizeClassName="h-14 text-center text-2xl tracking-[0.4em]"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />

        <Button type="submit" size="lg" fullWidth>
          Entrar
        </Button>
        <Button
          variant="text"
          className="self-center"
          onClick={() => {
            setCode("");
            setStep("credentials");
          }}
        >
          Voltar
        </Button>
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        // TODO(login): validar email e palavra-passe com uma Server Action (Supabase Auth)
        // antes de pedir o código. Por agora só avança de passo.
        setStep("code");
      }}
    >
      <div className="flex flex-col gap-2">
        <PageTitle>Entrar</PageTitle>
        <p className="m-0 text-[15px] text-muted">Use a sua conta da equipa Mudaro.</p>
      </div>

      {hasError && (
        <div
          role="alert"
          className="rounded-xl border border-danger-border bg-danger-surface px-3.5 py-3 text-sm leading-[1.45] text-danger-foreground"
        >
          Não foi possível entrar. Confirme o email e a palavra-passe.
        </div>
      )}

      <TextField
        inputRef={emailRef}
        name="email"
        label="Email"
        type="email"
        required
        requiredMark={false}
        autoComplete="username"
        placeholder="nome@mudaro.pt"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <TextField
        name="password"
        label="Palavra-passe"
        type="password"
        required
        requiredMark={false}
        autoComplete="current-password"
        placeholder="A sua palavra-passe"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Button type="submit" size="lg" fullWidth>
        Continuar
      </Button>
    </form>
  );
}
