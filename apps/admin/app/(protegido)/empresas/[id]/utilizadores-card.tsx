import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { StatusPill, type PillTone } from "@/app/components/ui/status-pill";
import { formatDate } from "@/app/lib/format";
import type { Utilizador } from "../_data/mock";
import { ResendInviteButton } from "./resend-invite-button";

const thClass = "whitespace-nowrap border-b border-line py-2.5 font-bold";
const tdClass = "border-b border-line-soft py-3";

function estadoDe(user: Utilizador, empresaDesativada: boolean): { label: string; tone: PillTone } {
  if (empresaDesativada) return { label: "Bloqueado", tone: "muted" };
  if (user.convitePendente) return { label: "Convite pendente", tone: "outline" };
  return { label: "Ativo", tone: "solid" };
}

type UtilizadoresCardProps = {
  empresaId: string;
  utilizadores: Utilizador[];
  empresaDesativada: boolean;
};

export function UtilizadoresCard({ empresaId, utilizadores, empresaDesativada }: UtilizadoresCardProps) {
  return (
    <Card title="Utilizadores da empresa" aside="Os operários são convidados pelo administrador na app">
      <div
        role="region"
        aria-label="Lista de utilizadores"
        tabIndex={0}
        className="-mx-6 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
      >
        <table className="w-full min-w-[640px] border-collapse text-[15px]">
          <caption className="sr-only">Utilizadores da empresa</caption>
          <thead>
            <tr className="text-left text-[13px] text-muted">
              <th scope="col" className={`${thClass} px-6`}>Nome</th>
              <th scope="col" className={`${thClass} px-3`}>Perfil</th>
              <th scope="col" className={`${thClass} px-3`}>Estado</th>
              <th scope="col" className={`${thClass} px-3`}>Último acesso</th>
              <th scope="col" className={`${thClass} px-6 text-right`}>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {utilizadores.map((user) => {
              const estado = estadoDe(user, empresaDesativada);
              return (
                <tr key={user.id}>
                  <td className={`${tdClass} px-6`}>
                    <span className="font-bold">{user.nome}</span>
                    <div className="text-[13px] text-muted">{user.email}</div>
                  </td>
                  <td className={`${tdClass} px-3`}>{user.perfil}</td>
                  <td className={`${tdClass} px-3`}>
                    <StatusPill tone={estado.tone}>{estado.label}</StatusPill>
                  </td>
                  <td className={`${tdClass} px-3 text-muted`}>
                    {user.ultimoAcesso ? formatDate(user.ultimoAcesso.slice(0, 10)) : "Nunca"}
                  </td>
                  <td className={`${tdClass} px-6 text-right`}>
                    <div className="flex justify-end">
                      {!empresaDesativada && user.convitePendente ? (
                        <ResendInviteButton empresaId={empresaId} userId={user.id} nome={user.nome} />
                      ) : (
                        // Sin diseño de flujo todavía: se muestra inerte.
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          title="Em breve"
                          aria-label={`${empresaDesativada ? "Ver" : "Desativar"}: ${user.nome} (em breve)`}
                        >
                          {empresaDesativada ? "Ver" : "Desativar"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
