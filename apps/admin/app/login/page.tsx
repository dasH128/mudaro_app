import type { Metadata } from "next";
import { MudaroSymbol } from "@mudaro/ui";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Painel Mudaro · Entrar",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-wrap bg-background text-foreground">
      {/* Panel de marca */}
      <aside className="box-border flex flex-[1_1_420px] max-w-full flex-col justify-between gap-12 bg-foreground p-12 text-background">
        <div className="flex items-center gap-3">
          <MudaroSymbol variant="light" className="h-9 w-[30px]" />
          <span className="font-display text-[22px] font-extrabold tracking-[-0.5px]">MUDARO</span>
        </div>

        <div className="flex max-w-[420px] flex-col gap-5">
          <div aria-hidden="true">
            <MudaroSymbol variant="light" className="h-[146px] w-[120px]" />
          </div>
          <p className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Painel interno
          </p>
          <p className="m-0 text-base leading-[1.55] text-on-ink">
            Alta das empresas do piloto, catálogo de objetos e suporte. Acesso reservado à equipa Mudaro.
          </p>
        </div>

        <span className="text-[13px] text-on-ink">admin.mudaro.pt</span>
      </aside>

      {/* Formulario */}
      <main className="box-border flex min-w-0 flex-[999_1_480px] items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[400px] flex-col gap-6">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
