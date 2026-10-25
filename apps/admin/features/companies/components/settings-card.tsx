import { Card } from "@/app/components/ui/card";
import { StepIcon } from "@/app/components/ui/step-icon";
import { TOTAL_STEPS } from "@/features/companies/domain/status";

const STEPS = [
  { titulo: "Conta do administrador", detail: "Palavra-passe definida" },
  { titulo: "Perfil da empresa", detail: "Logótipo, NIF e morada da base" },
  { titulo: "Veículos", detail: "Pelo menos 1 ativo" },
  { titulo: "Tarifa", detail: "Versão 1 guardada" },
] as const;

export function SettingsCard({ setupSteps }: { setupSteps: number }) {
  // "Serviços extra" é opcional: aparece como feito quando os 4 passos obrigatórios estão completos.
  const rows = [
    ...STEPS.map((step, i) => ({ ...step, done: i < setupSteps, status: i < setupSteps ? "Feito" : "Pendente" })),
    {
      titulo: "Serviços extra",
      detail: "Opcional",
      done: setupSteps >= TOTAL_STEPS,
      status: setupSteps >= TOTAL_STEPS ? "Feito" : "Opcional",
    },
  ];

  return (
    <Card title="Configuração" aside={`${setupSteps} de ${TOTAL_STEPS} passos obrigatórios`}>
      <ul className="m-0 list-none p-0">
        {rows.map((row, i) => (
          <li key={row.titulo} className={`flex items-center gap-3 py-3 ${i ? "border-t border-line-soft" : ""}`}>
            <StepIcon done={row.done} />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold">{row.titulo}</span>
              <span className="text-[13px] text-muted">{row.detail}</span>
            </span>
            <span className="text-[13px] font-bold text-muted">{row.status}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
