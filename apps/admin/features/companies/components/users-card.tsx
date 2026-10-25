import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { StatusPill, type PillTone } from "@/app/components/ui/status-pill";
import { formatDate } from "@/app/lib/format";
import type { User } from "@/features/companies/domain/types";
import { ResendInviteButton } from "./resend-invite-button";

const thClass = "whitespace-nowrap border-b border-line py-2.5 font-bold";
const tdClass = "border-b border-line-soft py-3";

function statusOf(user: User, companyDeactivated: boolean): { label: string; tone: PillTone } {
  if (companyDeactivated) return { label: "Bloqueado", tone: "muted" };
  if (user.invitationPending) return { label: "Convite pendente", tone: "outline" };
  return { label: "Ativo", tone: "solid" };
}

type UsersCardProps = {
  companyId: string;
  users: User[];
  companyDeactivated: boolean;
};

export function UsersCard({ companyId, users, companyDeactivated }: UsersCardProps) {
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
            {users.map((user) => {
              const status = statusOf(user, companyDeactivated);
              return (
                <tr key={user.id}>
                  <td className={`${tdClass} px-6`}>
                    <span className="font-bold">{user.name}</span>
                    <div className="text-[13px] text-muted">{user.email}</div>
                  </td>
                  <td className={`${tdClass} px-3`}>{user.profile}</td>
                  <td className={`${tdClass} px-3`}>
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  </td>
                  <td className={`${tdClass} px-3 text-muted`}>
                    {user.lastAccess ? formatDate(user.lastAccess.slice(0, 10)) : "Nunca"}
                  </td>
                  <td className={`${tdClass} px-6 text-right`}>
                    <div className="flex justify-end">
                      {!companyDeactivated && user.invitationPending ? (
                        <ResendInviteButton companyId={companyId} userId={user.id} name={user.name} />
                      ) : (
                        // Sin diseño de flujo todavía: se muestra inerte.
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          title="Em breve"
                          aria-label={`${companyDeactivated ? "Ver" : "Desativar"}: ${user.name} (em breve)`}
                        >
                          {companyDeactivated ? "Ver" : "Desativar"}
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
