import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { StepIcon } from "@/app/components/ui/step-icon";
import { formatDate } from "@/app/lib/format";
import type { CompanyDetail } from "@/features/companies/domain/types";

const join = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" · ");

export function DocumentsCard({ company }: { company: CompanyDetail }) {
  const docs = [
    {
      titulo: "Licença IMT",
      ok: company.imtUpToDate,
      detail: company.imtUpToDate
        ? join([
            company.imtVerifiedAt ? `Verificada em ${formatDate(company.imtVerifiedAt)}` : "Verificada",
            company.imtReference,
          ])
        : "Por verificar",
    },
    {
      titulo: "Contrato RGPD",
      ok: company.gdprContract,
      detail: company.gdprContract
        ? join([
            company.gdprSignedAt ? `Assinado em ${formatDate(company.gdprSignedAt)}` : "Assinado",
            company.gdprVersion,
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
            <span className="text-[13px] text-muted">{doc.detail}</span>
          </span>
        </div>
      ))}
      {!company.gdprContract && (
        // Sin diseño de flujo todavía: se muestra inerte.
        <Button variant="secondary" disabled title="Em breve" aria-label="Registar contrato (em breve)">
          Registar contrato
        </Button>
      )}
    </Card>
  );
}
