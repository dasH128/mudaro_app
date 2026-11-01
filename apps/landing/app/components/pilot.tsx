import { IconCheck } from "./icons";
import { SectionHeading } from "./section-heading";

const GIVES = [
  "Acesso gratuito durante as 8 semanas",
  "Configuração inicial feita com a nossa equipa",
  "Tarifas e catálogo ajustados à tua empresa",
  "Contacto direto para dúvidas e pedidos",
];
const ASKS = [
  "Usar a Mudaro nos teus orçamentos",
  "Uma conversa de 20 minutos por semana",
  "Dizer-nos o que falta e o que sobra",
];

function List({ items, tone }: { items: string[]; tone: "primary" | "ink" }) {
  return (
    <ul className="mt-4 space-y-2.5 text-sm">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${tone === "primary" ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}>
            <IconCheck className="size-3" />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

export function Pilot() {
  return (
    <section id="piloto" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 lg:py-16">
      <SectionHeading label="Piloto" title="Procuramos 5 a 10 empresas de mudanças.">
        Vamos construir a Mudaro com quem faz mudanças todos os dias. Se entrares agora, ajudas a decidir o que fica.
      </SectionHeading>

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.7fr_1.15fr_1.15fr]">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div className="rounded-2xl bg-foreground p-5 text-background">
            <p className="font-display text-5xl font-extrabold leading-none tracking-tight">8</p>
            <p className="mt-1 text-sm text-on-ink">semanas de piloto</p>
          </div>
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="font-display text-5xl font-extrabold leading-none tracking-tight">10</p>
            <p className="mt-1 text-sm">vagas no máximo</p>
          </div>
        </div>
        <article className="rounded-2xl border-2 border-foreground bg-surface p-6">
          <h3 className="font-display text-xl font-extrabold tracking-tight">O que recebes</h3>
          <List items={GIVES} tone="primary" />
        </article>
        <article className="rounded-2xl border border-border bg-surface-soft p-6">
          <h3 className="font-display text-xl font-extrabold tracking-tight">O que te pedimos</h3>
          <List items={ASKS} tone="ink" />
        </article>
      </div>
    </section>
  );
}
