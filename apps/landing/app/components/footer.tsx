import { MudaroSymbol } from "@mudaro/ui";

const COLUMNS = [
  { title: "Produto", links: [["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Confiança", "#confianca"]] },
  { title: "Piloto", links: [["O que recebes", "#piloto"], ["Candidatar-me", "#candidatura"]] },
];

export function Footer() {
  return (
    <footer className="bg-foreground py-10 text-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <MudaroSymbol variant="light" className="h-10 w-auto" />
            <span className="font-display text-2xl font-extrabold tracking-tight">MUDARO</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-on-ink">
            Software para empresas de mudanças. Da chamada ao orçamento aceite e à mudança documentada.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-ink">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="hover:underline">{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col justify-between gap-2 border-t border-background/15 px-6 pt-5 text-xs text-on-ink sm:flex-row">
        <p>© 2026 Mudaro. Todos os direitos reservados.</p>
        <p>A tua mudança, em boas mãos.</p>
      </div>
    </footer>
  );
}
