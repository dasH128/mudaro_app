import { IconEyeOff, IconLock, IconShield } from "./icons";
import { SectionHeading } from "./section-heading";

const POINTS = [
  { icon: IconEyeOff, title: "Operários sem preços", text: "Cada pessoa da equipa vê só os seus trabalhos. Tarifas, custos e margens ficam com o administrador." },
  { icon: IconLock, title: "Dados só teus", text: "Cada empresa está isolada das outras. Ninguém vê a tua carteira de clientes." },
  { icon: IconShield, title: "Provas que não se apagam", text: "Atas, fotos e assinaturas ficam bloqueadas quando o trabalho fecha. Pensado para o RGPD." },
];

export function Trust() {
  return (
    <section id="confianca" className="scroll-mt-24 bg-foreground py-12 text-background lg:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading tone="ink" label="Confiança" title="O negócio é teu. A Mudaro só o organiza.">
          Privacidade e provas são parte do produto desde o primeiro dia do piloto.
        </SectionHeading>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-background/15 bg-background/5 p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-on-ink">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
