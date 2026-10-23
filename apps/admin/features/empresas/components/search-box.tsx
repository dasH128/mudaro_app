import { ROUTES } from "@/app/lib/routes";
import type { EstadoEmpresa } from "@/features/empresas/domain/estado";

type SearchBoxProps = {
  q: string;
  estado: EstadoEmpresa | undefined;
};

export function SearchBox({ q, estado }: SearchBoxProps) {
  return (
    <form
      action={ROUTES.empresas.list}
      method="get"
      role="search"
      className="box-border flex h-11 max-w-[420px] items-center gap-2 rounded-[10px] border border-field-border bg-surface px-3 text-muted focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-foreground"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      {estado && <input type="hidden" name="estado" value={estado} />}
      <input
        type="search"
        name="q"
        defaultValue={q}
        aria-label="Pesquisar empresas"
        placeholder="Pesquisar por nome, NIF ou email"
        className="h-10 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-foreground outline-none placeholder:text-field-placeholder"
      />
      <button type="submit" className="sr-only">
        Pesquisar
      </button>
    </form>
  );
}
