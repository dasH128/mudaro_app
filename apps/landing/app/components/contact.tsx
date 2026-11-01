import { IconArrow, IconCheck } from "./icons";

// Solo diseño: el formulario todavía no envía datos ni valida nada
const INPUT =
  "w-full rounded-xl border border-field-border bg-surface px-4 py-3 placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-bold">{label}</label>
      <input id={name} name={name} type={type} placeholder={placeholder} className={INPUT} />
    </div>
  );
}

export function Contact() {
  return (
    <section id="candidatura" className="scroll-mt-24 bg-primary py-12 text-primary-foreground lg:py-16">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
            Entra no piloto da Mudaro.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed">
            Deixa os teus dados e falamos contigo em 2 dias úteis. Sem compromisso e sem cartão.
          </p>
          <ul className="mt-6 space-y-2 text-sm font-bold">
            {["Configuração feita com a nossa equipa", "Acesso gratuito durante o piloto", "Sem cartão nem compromisso"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid size-5 place-items-center rounded-full bg-foreground text-background">
                  <IconCheck className="size-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <form className="rounded-3xl bg-background p-6 text-foreground shadow-lg shadow-foreground/20 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa" name="company" placeholder="Transportes Silva" />
            <Field label="O teu nome" name="name" placeholder="Ana Silva" />
            <Field label="Telefone" name="phone" type="tel" placeholder="912 345 678" />
            <Field label="Email" name="email" type="email" placeholder="ana@empresa.pt" />
          </div>
          <div className="mt-4">
            <label htmlFor="team" className="mb-1.5 block text-sm font-bold">Quantas mudanças fazes por mês?</label>
            <select id="team" name="team" defaultValue="" className={INPUT}>
              <option value="" disabled>Escolhe uma opção</option>
              <option>Menos de 10</option>
              <option>10 a 30</option>
              <option>Mais de 30</option>
            </select>
          </div>
          <button
            type="button"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Quero entrar no piloto
            <IconArrow className="size-5" />
          </button>
          <p className="mt-3 text-center text-sm text-muted">Usamos os teus dados só para falar contigo sobre o piloto.</p>
        </form>
      </div>
    </section>
  );
}
