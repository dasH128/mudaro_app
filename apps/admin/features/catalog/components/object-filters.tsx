import { Button } from "@/app/components/ui/button";
import { controlClass } from "@/app/components/form/fields";
import { ROUTES } from "@/app/lib/routes";
import type { ObjectFilters as Filters, MarkFilter, StateFilter } from "../domain/filters";
import type { CatalogGroup } from "../domain/types";

const MARK_OPTIONS: { value: MarkFilter; label: string }[] = [
  { value: "fragile", label: "Frágil" },
  { value: "disassembly", label: "Desmontagem" },
  { value: "extra_crew", label: "Equipa extra" },
  { value: "translation_missing", label: "Tradução em falta" },
];

const STATE_OPTIONS: { value: StateFilter; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
  { value: "all", label: "Todos" },
];

type ObjectFiltersProps = {
  filters: Filters;
  categories: readonly CatalogGroup[];
  rooms: readonly CatalogGroup[];
};

const labelClass = "text-[13px] font-bold";

type SelectProps = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  allLabel?: string;
  className: string;
};

function FilterSelect({ name, label, value, options, allLabel, className }: SelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={value} className={`${controlClass} h-11 border-field-border text-[15px]`}>
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Formulario GET: los filtros viven en la URL y se aplican en el servidor.
export function ObjectFilters({ filters, categories, rooms }: ObjectFiltersProps) {
  const toOptions = (groups: readonly CatalogGroup[]) => groups.map((g) => ({ value: g.slug, label: g.pt }));

  return (
    <form action={ROUTES.catalog.list} method="get" role="search" className="flex flex-wrap items-end gap-3">
      <div className="flex flex-[2_1_300px] flex-col gap-1.5">
        <label htmlFor="q" className={labelClass}>
          Pesquisar
        </label>
        <div className="box-border flex h-11 items-center gap-2 rounded-[10px] border border-field-border bg-surface px-3 text-muted focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-foreground">
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
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Nome ou sinónimo em PT, ES ou EN"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-foreground outline-none placeholder:text-field-placeholder"
          />
        </div>
      </div>
      <FilterSelect
        name="category"
        label="Categoria"
        value={filters.category ?? ""}
        options={toOptions(categories)}
        allLabel="Todas"
        className="flex-[1_1_180px]"
      />
      <FilterSelect
        name="room"
        label="Divisão"
        value={filters.room ?? ""}
        options={toOptions(rooms)}
        allLabel="Todas"
        className="flex-[1_1_180px]"
      />
      <FilterSelect
        name="mark"
        label="Filtro"
        value={filters.mark ?? ""}
        options={MARK_OPTIONS}
        allLabel="Todas"
        className="flex-[1_1_160px]"
      />
      <FilterSelect
        name="state"
        label="Estado"
        value={filters.state}
        options={STATE_OPTIONS}
        className="flex-[1_1_150px]"
      />
      <Button type="submit" variant="secondary">
        Filtrar
      </Button>
    </form>
  );
}
