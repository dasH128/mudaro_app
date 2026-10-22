"use client";

import { useEffect, useRef, useState } from "react";

type Step = "credentials" | "code";

type LoginFormProps = {
  /** Muestra el aviso de credenciales incorrectas. Lo activará la Server Action de login. */
  hasError?: boolean;
};

const fieldClass =
  "box-border h-11 w-full rounded-[10px] border border-field-border bg-surface px-3 text-[15px] text-foreground placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground";

const primaryButtonClass =
  "box-border inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-primary px-5 text-[15px] font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

const titleClass =
  "m-0 font-display text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em]";

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
          <h1 className={titleClass}>Verificação em dois passos</h1>
          <p className="m-0 text-[15px] leading-[1.5] text-muted">
            Introduza o código de 6 dígitos da sua aplicação de autenticação.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="otp" className="text-sm font-bold">
            Código
          </label>
          <input
            ref={codeRef}
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            required
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`${fieldClass} !h-14 text-center text-2xl tracking-[0.4em]`}
          />
        </div>

        <button type="submit" className={primaryButtonClass}>
          Entrar
        </button>
        <button
          type="button"
          onClick={() => {
            setCode("");
            setStep("credentials");
          }}
          className="cursor-pointer self-center border-0 bg-transparent p-2 text-sm font-medium text-foreground underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
        >
          Voltar
        </button>
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
        <h1 className={titleClass}>Entrar</h1>
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-bold">
          Email
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="nome@mudaro.pt"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pw" className="text-sm font-bold">
          Palavra-passe
        </label>
        <input
          id="pw"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="A sua palavra-passe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
        />
      </div>

      <button type="submit" className={primaryButtonClass}>
        Continuar
      </button>
    </form>
  );
}
