import { IconCalc, IconCamera, IconChat, IconClock } from "./icons";
import { SectionHeading } from "./section-heading";

const PAINS = [
  { icon: IconChat, title: "Pedidos perdidos no WhatsApp", text: "Mensagens, áudios e fotos soltas. Quando vais orçamentar, já não sabes o que o cliente disse." },
  { icon: IconClock, title: "Visitas só para medir", text: "Meio dia a ver móveis e escadas para um preço que o cliente talvez nem aceite." },
  { icon: IconCalc, title: "Estimativas que falham", text: "O trabalho demora mais do que previste e a margem desaparece sem dares por isso." },
  { icon: IconCamera, title: "Danos sem provas", text: "Um risco no sofá, uma discussão na entrega e nada para mostrar do estado inicial." },
];

export function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
      <SectionHeading label="O que vemos todos os dias" title="Orçamentar uma mudança não devia ocupar o teu dia inteiro.">
        Falámos com transportistas e o padrão repete-se: o tempo perde-se antes de a mudança começar.
      </SectionHeading>
      <div className="mt-8 grid overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-2 lg:grid-cols-4">
        {PAINS.map(({ icon: Icon, title, text }, i) => (
          <article
            key={title}
            className={`p-6 ${i > 0 ? "border-t border-border sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l sm:border-border" : ""} ${i > 1 ? "sm:border-t sm:border-border lg:border-t-0" : ""} ${i > 0 ? "lg:border-l lg:border-border" : ""}`}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary-foreground">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold leading-snug">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
