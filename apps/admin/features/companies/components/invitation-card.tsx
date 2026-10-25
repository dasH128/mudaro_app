import { Card } from "@/app/components/ui/card";
import { DescriptionItem } from "@/app/components/ui/description-item";
import { formatDateTime } from "@/app/lib/format";
import type { Invitation } from "@/features/companies/domain/types";
import { InvitationActions } from "./invitation-actions";

export function InvitationCard({ companyId, invitation }: { companyId: string; invitation: Invitation }) {
  return (
    <Card title="Convite do administrador">
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <DescriptionItem term="Enviado em">
          {invitation.sentAt ? formatDateTime(invitation.sentAt) : "Ainda não enviado"}
        </DescriptionItem>
        <DescriptionItem term="Válido até">{formatDateTime(invitation.validUntil)}</DescriptionItem>
      </dl>
      <InvitationActions companyId={companyId} link={invitation.link} />
    </Card>
  );
}
