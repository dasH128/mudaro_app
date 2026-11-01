import { ButtonLink } from "./button";
import { IconArrow, IconCheck } from "./icons";
import { ProposalMockup } from "./proposal-mockup";

// Cifras tomadas de los requisitos: RF-13 (30 s), RF-08 (10 min), 4 pasos del flujo
const STATS = [
  { value: "30 s", label: "para registar um pedido" },
  { value: "10 min", label: "até ao primeiro orçamento" },
  { value: "0", label: "contas para o cliente criar" },
  { value: "100 %", label: "da mudança documentada" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-10 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-background px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em]">
              Software para empresas de mudanças
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Da chamada ao orçamento aceite,{" "}
              <span className="relative inline-block">
                <span className="relative z-10">sem caderno</span>
                <span className="absolute inset-x-0 bottom-1 z-0 h-3 -skew-x-6 bg-primary sm:bottom-2 sm:h-4" aria-hidden="true" />
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              O cliente preenche o inventário por um link. A Mudaro calcula volume, equipa, preço e margem.
              Tu envias a proposta e a mudança fica documentada do princípio ao fim.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="#candidatura" className="text-lg">
                Candidatar a minha empresa
                <IconArrow className="size-5" />
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="outline" className="text-lg">
                Ver como funciona
              </ButtonLink>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
              {["Sem instalar nada no cliente", "iOS e Android", "Funciona sem rede"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-foreground text-background">
                    <IconCheck className="size-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <ProposalMockup />
        </div>

        <dl className="mt-12 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`p-5 ${i % 2 === 1 ? "border-l border-border" : ""} ${i > 1 ? "border-t border-border lg:border-t-0" : ""} ${i > 0 ? "lg:border-l lg:border-border" : ""}`}
            >
              <dt className="font-display text-4xl font-extrabold tracking-tight">{s.value}</dt>
              <dd className="mt-1 text-sm text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
