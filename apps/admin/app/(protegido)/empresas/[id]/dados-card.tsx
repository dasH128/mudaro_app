import { Card } from "@/app/components/ui/card";
import { DescriptionItem } from "@/app/components/ui/description-item";
import type { EmpresaDetalhe } from "../_data/mock";

const orDash = (value: string) => value || "—";

export function DadosCard({ empresa }: { empresa: EmpresaDetalhe }) {
  return (
    <Card title="Dados">
      <dl className="m-0 flex flex-col gap-3.5">
        <DescriptionItem term="Telefone">{orDash(empresa.telefone)}</DescriptionItem>
        <DescriptionItem term="Email geral">{orDash(empresa.emailGeral)}</DescriptionItem>
        <DescriptionItem term="Morada da base">{orDash(empresa.morada)}</DescriptionItem>
        <DescriptionItem term="Origem do contacto">{orDash(empresa.origem)}</DescriptionItem>
        <DescriptionItem term="Notas internas">
          <span className="whitespace-pre-wrap">{orDash(empresa.notas)}</span>
        </DescriptionItem>
      </dl>
    </Card>
  );
}
