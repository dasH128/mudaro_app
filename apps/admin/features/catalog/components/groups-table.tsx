import type { CatalogGroup } from "../domain/types";
import { EditGroupButton } from "./group-dialog";

const thClass = "border-b border-line px-5 py-3.5 font-bold";
const tdClass = "border-b border-line-soft px-5 py-3.5";

type GroupsTableProps = {
  label: string;
  groups: readonly CatalogGroup[];
  counts: ReadonlyMap<string, number>;
};

export function GroupsTable({ label, groups, counts }: GroupsTableProps) {
  return (
    <div
      role="region"
      aria-label={`Lista de ${label}`}
      tabIndex={0}
      className="overflow-x-auto rounded-2xl border border-line bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="text-left text-xs text-muted">
            <th scope="col" className={`${thClass} w-14`}>Ordem</th>
            <th scope="col" className={thClass}>Português</th>
            <th scope="col" className={thClass}>Espanhol</th>
            <th scope="col" className={thClass}>Inglês</th>
            <th scope="col" className={thClass}>Slug · ícone</th>
            <th scope="col" className={`${thClass} text-right`}>Objetos</th>
            <th scope="col" className={thClass}>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.slug}>
              <td className={`${tdClass} tabular-nums text-muted`}>{group.order}</td>
              <td className={`${tdClass} font-bold`}>{group.pt}</td>
              <td className={tdClass}>{group.es}</td>
              <td className={tdClass}>{group.en}</td>
              <td className={tdClass}>
                <code className="text-[13px] text-muted">
                  {group.slug} · {group.icon}
                </code>
              </td>
              <td className={`${tdClass} text-right tabular-nums`}>{counts.get(group.slug) ?? 0}</td>
              <td className={`${tdClass} text-right`}>
                <EditGroupButton group={group} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
