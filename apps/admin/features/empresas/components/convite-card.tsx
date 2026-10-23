import { Card } from "@/app/components/ui/card";
import { DescriptionItem } from "@/app/components/ui/description-item";
import { formatDateTime } from "@/app/lib/format";
import type { Convite } from "@/features/empresas/domain/types";
import { ConviteActions } from "./convite-actions";

export function ConviteCard({ empresaId, convite }: { empresaId: string; convite: Convite }) {
  return (
    <Card title="Convite do administrador">
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <DescriptionItem term="Enviado em">
          {convite.enviadoEm ? formatDateTime(convite.enviadoEm) : "Ainda não enviado"}
        </DescriptionItem>
        <DescriptionItem term="Válido até">{formatDateTime(convite.validoAte)}</DescriptionItem>
      </dl>
      <ConviteActions empresaId={empresaId} link={convite.link} />
    </Card>
  );
}
