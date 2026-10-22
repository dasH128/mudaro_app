import { Card } from "@/app/components/ui/card";
import { StepIcon } from "@/app/components/ui/step-icon";
import { TOTAL_PASSOS } from "../_data/estado";

const PASSOS = [
  { titulo: "Conta do administrador", detalhe: "Palavra-passe definida" },
  { titulo: "Perfil da empresa", detalhe: "Logótipo, NIF e morada da base" },
  { titulo: "Veículos", detalhe: "Pelo menos 1 ativo" },
  { titulo: "Tarifa", detalhe: "Versão 1 guardada" },
] as const;

export function ConfiguracaoCard({ passosConfig }: { passosConfig: number }) {
  // "Serviços extra" é opcional: aparece como feito quando os 4 passos obrigatórios estão completos.
  const rows = [
    ...PASSOS.map((passo, i) => ({ ...passo, done: i < passosConfig, estado: i < passosConfig ? "Feito" : "Pendente" })),
    {
      titulo: "Serviços extra",
      detalhe: "Opcional",
      done: passosConfig >= TOTAL_PASSOS,
      estado: passosConfig >= TOTAL_PASSOS ? "Feito" : "Opcional",
    },
  ];

  return (
    <Card title="Configuração" aside={`${passosConfig} de ${TOTAL_PASSOS} passos obrigatórios`}>
      <ul className="m-0 list-none p-0">
        {rows.map((row, i) => (
          <li key={row.titulo} className={`flex items-center gap-3 py-3 ${i ? "border-t border-line-soft" : ""}`}>
            <StepIcon done={row.done} />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold">{row.titulo}</span>
              <span className="text-[13px] text-muted">{row.detalhe}</span>
            </span>
            <span className="text-[13px] font-bold text-muted">{row.estado}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
