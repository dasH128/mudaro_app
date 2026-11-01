import type { ReactNode } from "react";

import { IconCalc, IconCalendar, IconCamera, IconCheck, IconLink, IconTable, IconWifiOff } from "./icons";
import { SectionHeading } from "./section-heading";

type CardProps = {
  icon: (p: { className?: string }) => ReactNode;
  title: string;
  text: string;
  className?: string;
  tone?: "surface" | "ink" | "primary";
  children?: ReactNode;
};

const TONES = {
  surface: "border border-border bg-surface",
  ink: "bg-foreground text-background",
  primary: "bg-primary text-primary-foreground",
} as const;

function Card({ icon: Icon, title, text, className = "", tone = "surface", children }: CardProps) {
  const iconTone = tone === "surface" ? "bg-foreground text-background" : tone === "ink" ? "bg-primary text-primary-foreground" : "bg-foreground text-background";
  const textTone = tone === "ink" ? "text-on-ink" : tone === "primary" ? "text-primary-foreground" : "text-muted";
  return (
    <article className={`flex flex-col rounded-2xl p-6 ${TONES[tone]} ${className}`}>
      <span className={`grid size-11 place-items-center rounded-xl ${iconTone}`}>
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className={`mt-1.5 text-sm leading-relaxed ${textTone}`}>{text}</p>
      {children ? <div className="mt-5 flex-1 content-end">{children}</div> : null}
    </article>
  );
}

// Mini ilustraciones en CSS: valores de ejemplo
function CostBar() {
  return (
    <div aria-hidden="true">
      <div className="flex h-3 overflow-hidden rounded-full bg-line-soft">
        <span className="w-[48%] bg-foreground" />
        <span className="w-[16%] bg-accent" />
        <span className="w-[10%] bg-line" />
        <span className="w-[26%] bg-primary" />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-foreground" />Mão de obra</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-accent" />Deslocação</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-primary" />Margem</span>
      </div>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-warn-border bg-warn-surface px-2.5 py-1 text-xs font-bold text-warn-foreground">
        Alerta: sem elevador, +1 h
      </span>
    </div>
  );
}

function RoomChips() {
  return (
    <ul className="flex flex-wrap gap-2" aria-hidden="true">
      {["Sala · 14 objetos", "Cozinha · 9", "Quarto · 11", "Garagem"].map((r, i) => (
        <li key={r} className={`rounded-full px-3 py-1 text-xs font-bold ${i < 3 ? "bg-foreground text-background" : "border border-dashed border-foreground"}`}>
          {r}
        </li>
      ))}
    </ul>
  );
}

function WeekGrid() {
  const cells = [
    [1, 0, 2, 0, 1],
    [0, 2, 0, 1, 0],
    [2, 0, 1, 0, 2],
  ];
  const tone = ["bg-line-soft", "bg-primary", "bg-foreground"];
  return (
    <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
      {cells.flat().map((c, i) => (
        <span key={i} className={`h-5 rounded-md ${tone[c]}`} />
      ))}
    </div>
  );
}

function Photos() {
  return (
    <div className="flex gap-2" aria-hidden="true">
      {["bg-accent", "bg-line", "bg-foreground"].map((c, i) => (
        <span key={i} className={`grid h-14 flex-1 place-items-center rounded-lg ${c} ${i === 2 ? "text-background" : "text-primary-foreground"}`}>
          <IconCamera className="size-5" />
        </span>
      ))}
    </div>
  );
}

function SyncBadge() {
  return (
    <div className="flex items-center gap-2 text-xs font-bold" aria-hidden="true">
      <span className="rounded-full bg-background/15 px-3 py-1.5 text-on-ink">Sem rede</span>
      <span className="text-primary">›</span>
      <span className="flex items-center gap-1.5 rounded-full bg-success-surface px-3 py-1.5 text-success-foreground">
        <IconCheck className="size-3" /> Sincronizado
      </span>
    </div>
  );
}

function CsvTable() {
  const rows = [
    ["Maria Costa", "123 456 789", "694,95 €"],
    ["João Pires", "234 567 891", "1 120,00 €"],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-line text-xs" aria-hidden="true">
      <div className="grid grid-cols-3 bg-surface-head px-3 py-2 font-bold"><span>Cliente</span><span>NIF</span><span className="text-right">Total</span></div>
      {rows.map((r) => (
        <div key={r[0]} className="grid grid-cols-3 border-t border-line px-3 py-2">
          <span>{r[0]}</span><span className="text-muted">{r[1]}</span><span className="text-right font-bold">{r[2]}</span>
        </div>
      ))}
    </div>
  );
}

export function Features() {
  return (
    <section id="funcionalidades" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 lg:py-16">
      <SectionHeading label="Funcionalidades" title="Tudo o que uma mudança precisa, numa só ferramenta.">
        Do orçamento ao CSV para faturar. Cada peça pensada para quem está na rua e não à secretária.
      </SectionHeading>

      <div className="mt-8 grid gap-4 lg:grid-cols-6">
        <Card className="lg:col-span-4" icon={IconCalc} title="Cálculo automático" text="Volume com fator de estiba, escolha de veículos, equipa, horas e margem. Alertas antes de enviares a proposta.">
          <CostBar />
        </Card>
        <Card className="lg:col-span-2" tone="primary" icon={IconLink} title="Link do cliente" text="Inventário por divisões, fotos e serviços extra. O rascunho guarda-se sozinho.">
          <RoomChips />
        </Card>
        <Card className="lg:col-span-2" icon={IconCalendar} title="Agenda de trabalhos" text="Dia e semana, com veículos e pessoas. Sem marcar o mesmo camião duas vezes.">
          <WeekGrid />
        </Card>
        <Card className="lg:col-span-2" icon={IconCamera} title="Fotos e atas" text="Recolha e entrega com fotos, hora, local e assinatura do cliente.">
          <Photos />
        </Card>
        <Card className="lg:col-span-2" tone="ink" icon={IconWifiOff} title="Funciona sem rede" text="Numa cave ou numa aldeia, a equipa continua. Sincroniza quando houver rede.">
          <SyncBadge />
        </Card>
        <Card className="lg:col-span-6 lg:flex-row lg:items-center lg:gap-10" icon={IconTable} title="Pronto para faturar" text="Exportas os trabalhos fechados em CSV, com cliente, NIF, linhas, IVA e total, e passas ao teu programa de faturação certificado.">
          <div className="lg:w-[28rem]"><CsvTable /></div>
        </Card>
      </div>
    </section>
  );
}
