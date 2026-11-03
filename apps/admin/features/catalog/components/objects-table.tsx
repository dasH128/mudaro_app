import { StatusPill } from "@/app/components/ui/status-pill";
import type { CatalogGroup, CatalogItem } from "../domain/types";
import { CareMarks, Translations } from "./item-pills";

const thClass = "border-b border-line px-5 py-3.5 font-bold";
const tdClass = "border-b border-line-soft px-5 py-3.5";
const numClass = `${tdClass} text-right tabular-nums text-muted`;

type ObjectsTableProps = {
  items: readonly CatalogItem[];
  categories: readonly CatalogGroup[];
  rooms: readonly CatalogGroup[];
};

function roomsLabel(item: CatalogItem, rooms: readonly CatalogGroup[]): string {
  const names = item.rooms.map((slug) => rooms.find((r) => r.slug === slug)?.pt ?? slug);
  if (names.length === rooms.length) return "Todas";
  return names.length > 2 ? `${names[0]} +${names.length - 1}` : names.join(", ");
}

export function ObjectsTable({ items, categories, rooms }: ObjectsTableProps) {
  return (
    // Región enfocable: la tabla hace scroll horizontal en pantallas estrechas.
    <div
      role="region"
      aria-label="Lista de objetos"
      tabIndex={0}
      className="overflow-x-auto rounded-2xl border border-line bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <table className="w-full min-w-[1120px] border-collapse text-sm">
        <caption className="sr-only">Objetos do catálogo</caption>
        <thead>
          <tr className="text-left text-xs text-muted">
            <th scope="col" className={thClass}>Objeto</th>
            <th scope="col" className={thClass}>Categoria</th>
            <th scope="col" className={thClass}>Divisões</th>
            <th scope="col" className={`${thClass} text-right`}>Volume</th>
            <th scope="col" className={`${thClass} text-right`}>Dim. maior</th>
            <th scope="col" className={`${thClass} text-right`}>Peso</th>
            <th scope="col" className={`${thClass} text-right`}>Manip.</th>
            <th scope="col" className={thClass}>Cuidados</th>
            <th scope="col" className={thClass}>Traduções</th>
            <th scope="col" className={thClass}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={10} className={`${tdClass} py-8 text-center text-[15px] text-muted`}>
                Nenhum objeto com estes filtros.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className={item.active ? "" : "text-muted"}>
                <td className={tdClass}>
                  {/* La pantalla "Novo objeto" aún no tiene diseño: el nombre queda sin enlace. */}
                  <span className="font-bold">{item.pt}</span>
                  <div className="text-[13px] text-muted">
                    {item.es || "—"} · {item.en || "—"}
                  </div>
                </td>
                <td className={tdClass}>{categories.find((c) => c.slug === item.category)?.pt ?? item.category}</td>
                <td className={tdClass}>
                  <span title={item.rooms.map((s) => rooms.find((r) => r.slug === s)?.pt ?? s).join(", ")}>
                    {roomsLabel(item, rooms)}
                  </span>
                </td>
                {/* Valores de ejemplo: pendientes de validar con transportistas (RF-10). */}
                <td className={`${tdClass} text-right tabular-nums`}>[0,000] m³</td>
                <td className={numClass}>[cm]</td>
                <td className={numClass}>[kg]</td>
                <td className={numClass}>[min]</td>
                <td className={tdClass}>
                  <CareMarks marks={item.marks} />
                </td>
                <td className={tdClass}>
                  <Translations item={item} />
                </td>
                <td className={tdClass}>
                  {item.active ? <span className="text-[13px] font-bold">Ativo</span> : <StatusPill tone="muted" size="sm">Inativo</StatusPill>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
