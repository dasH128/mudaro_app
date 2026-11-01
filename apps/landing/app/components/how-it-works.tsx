import { IconCalc, IconCheck, IconLink, IconChat } from "./icons";
import { SectionHeading } from "./section-heading";

const STEPS = [
  { icon: IconChat, title: "Registas o pedido", text: "Nome, telefone, origem, destino e data. Em 30 segundos, no telemóvel.", chip: "Pedido criado" },
  { icon: IconLink, title: "O cliente preenche o inventário", text: "Recebe um link, percorre as divisões, junta fotos e indica andares e acessos.", chip: "Sem criar conta" },
  { icon: IconCalc, title: "A Mudaro calcula", text: "Volume, camião, equipa, horas, quilómetros, preço e margem. Ajustas o que quiseres.", chip: "Margem à vista" },
  { icon: IconCheck, title: "Proposta aceite com assinatura", text: "O cliente vê a proposta no mesmo link e assina. O trabalho entra na agenda.", chip: "Na agenda" },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 bg-accent py-12 text-primary-foreground lg:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading label="Como funciona" title="Quatro passos entre a chamada e o sim do cliente.">
          Tudo acontece num link e numa app. Sem folhas de cálculo e sem copiar dados de um sítio para outro.
        </SectionHeading>

        <div className="relative mt-10">
          <div className="step-line absolute left-[12%] right-[12%] top-6 hidden h-0.5 lg:block" aria-hidden="true" />
          <ol className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-background p-5 text-foreground">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-full border-4 border-accent bg-primary font-display text-xl font-extrabold text-primary-foreground">
                    {i + 1}
                  </span>
                  <s.icon className="size-6 text-muted" />
                </div>
                <h3 className="mt-4 text-lg font-bold leading-snug">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
                <span className="mt-4 inline-block rounded-full bg-surface-soft px-3 py-1 text-xs font-bold">{s.chip}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
