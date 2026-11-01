import { IconCheck, IconLink, IconTruck } from "./icons";

// Maqueta ilustrativa en CSS de una propuesta; los valores son de ejemplo, no datos reales
export function ProposalMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute -right-4 -top-4 size-full rotate-3 rounded-3xl bg-accent" />
      <div className="relative rounded-3xl border border-line bg-surface p-6 shadow-lg shadow-foreground/10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Proposta</p>
            <p className="font-display text-2xl font-extrabold tracking-tight">T2 Porto → Braga</p>
          </div>
          <span className="rounded-full border border-success-border bg-success-surface px-3 py-1 text-xs font-bold text-success-foreground">
            Aceite
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["Volume", "18,4 m³"],
            ["Equipa", "3 pessoas"],
            ["Horas", "6 h"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-surface-soft p-3">
              <p className="text-xs text-muted">{k}</p>
              <p className="font-bold">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-line p-3">
          <span className="grid size-10 place-items-center rounded-lg bg-foreground text-background">
            <IconTruck className="size-5" />
          </span>
          <div className="text-sm">
            <p className="font-bold">Camião 20 m³</p>
            <p className="text-muted">1 viagem · 58 km</p>
          </div>
        </div>

        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Mão de obra</dt><dd>420,00 €</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Deslocação</dt><dd>85,00 €</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Embalagem</dt><dd>60,00 €</dd></div>
          <div className="flex justify-between"><dt className="text-muted">IVA 23 %</dt><dd>129,95 €</dd></div>
          <div className="flex items-baseline justify-between pt-2">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-3xl font-extrabold tracking-tight">694,95 €</dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-foreground px-4 py-3 text-background">
          <span className="flex items-center gap-2 text-sm font-bold">
            <IconCheck className="size-4" /> Assinada pelo cliente
          </span>
          <span className="text-xs opacity-80">14/11/2026</span>
        </div>
      </div>

      <div className="absolute -right-2 top-24 hidden rotate-3 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-lg shadow-foreground/10 sm:flex lg:-right-6">
        <span className="size-2.5 rounded-full bg-success-dot" />
        <span className="font-bold">Margem 31 %</span>
      </div>

      <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-foreground/20 sm:-left-8">
        <IconLink className="size-4" /> Inventário recebido
      </div>
    </div>
  );
}
