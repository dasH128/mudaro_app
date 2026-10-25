import { Card } from "@/app/components/ui/card";
import { formatDateTime } from "@/app/lib/format";
import type { HistoryEvent } from "@/features/companies/domain/types";

export function HistoryCard({ history }: { history: HistoryEvent[] }) {
  return (
    <Card title="Histórico">
      <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
        {history.map((event) => (
          <li key={event.id} className="flex flex-col gap-0.5">
            <span className="font-bold">{event.text}</span>
            <span className="text-muted">
              {event.by} · {formatDateTime(event.at)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
