import { MudaroSymbol } from "@mudaro/ui";

import { IconArrow } from "./icons";

const LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#confianca", label: "Confiança" },
  { href: "#piloto", label: "Piloto" },
];

export function TopBar() {
  return (
    <div className="bg-foreground text-background">
      <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium sm:text-sm">
        <span className="size-2 shrink-0 rounded-full bg-primary" />
        Piloto aberto a 5 a 10 empresas de mudanças.
        <a href="#candidatura" className="font-bold underline underline-offset-4">Candidata-te</a>
      </p>
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-3 z-30 px-4 pt-3">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-border bg-surface/85 px-4 py-2.5 shadow-lg shadow-foreground/5 backdrop-blur">
        <a href="#top" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <MudaroSymbol className="h-9 w-auto" />
          <span className="font-display text-2xl font-extrabold tracking-tight">MUDARO</span>
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#candidatura"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Candidatar-me
            <IconArrow className="size-4" />
          </a>

          {/* Menú móvil sin JavaScript */}
          <details className="group md:hidden">
            <summary
              aria-label="Abrir menu"
              className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-border [&::-webkit-details-marker]:hidden"
            >
              <span className="grid gap-1" aria-hidden="true">
                <span className="block h-0.5 w-5 rounded bg-foreground" />
                <span className="block h-0.5 w-5 rounded bg-foreground" />
                <span className="block h-0.5 w-3 rounded bg-foreground" />
              </span>
            </summary>
            <nav aria-label="Principal móvel" className="absolute inset-x-0 top-full mt-2 rounded-2xl border border-border bg-surface p-2 shadow-lg shadow-foreground/10">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} className="block rounded-xl px-4 py-3 font-medium hover:bg-foreground/5">
                  {l.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
