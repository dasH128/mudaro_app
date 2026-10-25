import { Card } from "@/app/components/ui/card";
import { DescriptionItem } from "@/app/components/ui/description-item";
import type { CompanyDetail } from "@/features/companies/domain/types";

const orDash = (value: string) => value || "—";

export function DataCard({ company }: { company: CompanyDetail }) {
  return (
    <Card title="Dados">
      <dl className="m-0 flex flex-col gap-3.5">
        <DescriptionItem term="Telefone">{orDash(company.phone)}</DescriptionItem>
        <DescriptionItem term="Email geral">{orDash(company.emailGeneral)}</DescriptionItem>
        <DescriptionItem term="Morada da base">{orDash(company.address)}</DescriptionItem>
        <DescriptionItem term="Origem do contacto">{orDash(company.origin)}</DescriptionItem>
        <DescriptionItem term="Notas internas">
          <span className="whitespace-pre-wrap">{orDash(company.notes)}</span>
        </DescriptionItem>
      </dl>
    </Card>
  );
}
