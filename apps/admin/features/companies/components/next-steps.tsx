const STEPS = [
  {
    title: "Criamos a empresa",
    text: 'Fica em "Convite pendente", sem utilizadores ativos.',
  },
  {
    title: "O administrador recebe o convite",
    text: "Email com link para definir a palavra-passe. Também pode copiar o link e enviá-lo por WhatsApp.",
  },
  {
    title: "Ele completa a configuração",
    text: 'Perfil, veículos e tarifa no assistente da app. A empresa passa a "Ativa" quando tiver o mínimo e o contrato assinado.',
  },
] as const;

export function NextSteps() {
  return (
    <aside className="sticky top-6 flex min-w-0 flex-[1_1_280px] flex-col gap-[18px] rounded-2xl bg-status-config-surface p-6">
      <h2 className="m-0 text-lg font-bold">O que acontece a seguir</h2>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[13px] font-bold text-background"
            >
              {i + 1}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold">{step.title}</span>
              <span className="text-sm leading-[1.45] text-muted">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
