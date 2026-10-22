import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { StepIcon } from "@/app/components/ui/step-icon";
import { formatDate } from "@/app/lib/format";
import type { EmpresaDetalhe } from "../_data/mock";

const join = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" · ");

export function DocumentosCard({ empresa }: { empresa: EmpresaDetalhe }) {
  const docs = [
    {
      titulo: "Licença IMT",
      ok: empresa.imtEmDia,
      detalhe: empresa.imtEmDia
        ? join([
            empresa.imtVerificadaEm ? `Verificada em ${formatDate(empresa.imtVerificadaEm)}` : "Verificada",
            empresa.imtReferencia,
          ])
        : "Por verificar",
    },
    {
      titulo: "Contrato RGPD",
      ok: empresa.rgpdContrato,
      detalhe: empresa.rgpdContrato
        ? join([
            empresa.rgpdAssinadoEm ? `Assinado em ${formatDate(empresa.rgpdAssinadoEm)}` : "Assinado",
            empresa.rgpdVersao,
          ])
        : "Sem contrato. A empresa não pode ser ativada.",
    },
  ];

  return (
    <Card title="Verificação e contrato">
      {docs.map((doc) => (
        <div key={doc.titulo} className="flex items-start gap-3">
          <StepIcon done={doc.ok} />
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-bold">{doc.titulo}</span>
            <span className="text-[13px] text-muted">{doc.detalhe}</span>
          </span>
        </div>
      ))}
      {!empresa.rgpdContrato && (
        // Sin diseño de flujo todavía: se muestra inerte.
        <Button variant="secondary" disabled title="Em breve" aria-label="Registar contrato (em breve)">
          Registar contrato
        </Button>
      )}
    </Card>
  );
}
