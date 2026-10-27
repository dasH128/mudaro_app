import { Card } from "@/app/components/ui/card";
import { formatDateTime } from "@/app/lib/format";
import type { HistoryAction, HistoryEvent } from "@/features/companies/domain/types";

// La interfaz traduce el código de la acción; el dominio no guarda texto.
const ACTION_TEXT: Record<HistoryAction, (detail: string | null) => string> = {
  company_created: () => "Empresa criada",
  company_activated: () => "Empresa ativada",
  company_deactivated: (detail) => `Empresa desativada. Motivo: ${detail}`,
  company_reactivated: () => "Empresa reativada",
  invitation_sent: () => "Convite enviado",
  invitation_resent: (detail) => `Convite reenviado para ${detail}`,
  invitation_link_regenerated: () => "Novo link do convite gerado",
  admin_first_login: () => "Administrador entrou pela primeira vez",
  gdpr_contract_registered: () => "Contrato RGPD registado",
  tariff_saved: (detail) => `Tarifa ${detail} guardada`,
};

export function HistoryCard({ history }: { history: HistoryEvent[] }) {
  return (
    <Card title="Histórico">
      <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
        {history.map((event) => (
          <li key={event.id} className="flex flex-col gap-0.5">
            <span className="font-bold">{ACTION_TEXT[event.action](event.detail)}</span>
            <span className="text-muted">
              {event.by} · {formatDateTime(event.at)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
