import { Card } from "@/app/components/ui/card";
import { formatDateTime } from "@/app/lib/format";
import type { EventoHistorial } from "@/features/empresas/domain/types";

export function HistoricoCard({ historial }: { historial: EventoHistorial[] }) {
  return (
    <Card title="Histórico">
      <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
        {historial.map((evento) => (
          <li key={evento.id} className="flex flex-col gap-0.5">
            <span className="font-bold">{evento.texto}</span>
            <span className="text-muted">
              {evento.por} · {formatDateTime(evento.em)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
