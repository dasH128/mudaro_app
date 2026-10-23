"use client";

import { useActionState, useEffect, useRef } from "react";

import { CheckboxField, SelectField, TextAreaField, TextField } from "@/app/components/form/fields";
import { Button, ButtonLink } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ROUTES } from "@/app/lib/routes";
import { REGIOES_PILOTO } from "@/features/empresas/domain/regioes";
import { createEmpresaAction } from "@/features/empresas/actions/crear-empresa";
import { DEFAULT_VALUES, FIELDS, FIELD_LABEL, type FieldName, type FormState } from "@/features/empresas/schemas/nueva-empresa";

const gridClass = "grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4";
const subCardClass = "flex flex-col gap-3.5 rounded-xl border border-line p-4";

const IDLE: FormState = { status: "idle" };

export function NuevaEmpresaForm() {
  const [state, formAction, isPending] = useActionState(createEmpresaAction, IDLE);
  const summaryRef = useRef<HTMLDivElement>(null);

  const values = state.status === "error" ? state.values : DEFAULT_VALUES;
  const errors = state.status === "error" ? state.fieldErrors : {};
  const errorFields = FIELDS.filter((field) => errors[field]);

  // Tras un envío con errores el foco pasa al resumen, para teclado y lectores de pantalla.
  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
  }, [state]);

  const text = (name: FieldName) => ({ name, defaultValue: values[name] as string, error: errors[name] });

  return (
    // noValidate: los mensajes los da el servidor (zod), no las burbujas del navegador.
    <form action={formAction} noValidate className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
      {errorFields.length > 0 && (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          className="rounded-xl border border-danger-border bg-danger-surface px-4 py-3.5 text-sm leading-[1.45] text-danger-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <p className="m-0 font-bold">Corrija os campos assinalados para criar a empresa.</p>
          <ul className="m-0 mt-1.5 list-disc pl-5">
            {errorFields.map((field) => (
              <li key={field}>
                <a href={`#${field}`} className="text-danger-foreground underline">
                  {FIELD_LABEL[field]}
                </a>
                : {errors[field]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card title="Dados da empresa">
        <div className={gridClass}>
          <TextField {...text("nome")} label="Nome comercial" required placeholder="Ex.: Mudanças Silva" />
          <TextField
            {...text("nif")}
            label="NIF"
            required
            inputMode="numeric"
            placeholder="9 dígitos"
            hint="Validamos o dígito de controlo."
          />
          <TextField {...text("telefone")} label="Telefone" type="tel" autoComplete="off" placeholder="9XX XXX XXX" />
          <TextField {...text("emailGeral")} label="Email geral" type="email" placeholder="geral@..." />
        </div>
        <TextField
          {...text("morada")}
          label="Morada da base"
          placeholder="Rua, número, código postal, localidade"
          hint="Pode ficar em branco. O administrador confirma-a no assistente."
        />
      </Card>

      <Card title="Administrador">
        <div className={gridClass}>
          <TextField {...text("adminNome")} label="Nome" required placeholder="Nome e apelido" />
          <TextField
            {...text("adminTelemovel")}
            label="Telemóvel"
            type="tel"
            autoComplete="off"
            placeholder="9XX XXX XXX"
          />
        </div>
        <TextField
          {...text("adminEmail")}
          label="Email"
          required
          type="email"
          placeholder="nome@empresa.pt"
          hint="Recebe o convite e fica como primeiro administrador da empresa."
        />
      </Card>

      <Card title="Verificação e contrato" description="Pode criar a empresa sem isto, mas não a pode ativar.">

        <div className={subCardClass}>
          <CheckboxField
            name="imtVerificada"
            label="Licença IMT verificada"
            description="Requisitos legais do IMT para o tipo de veículo da empresa."
            defaultChecked={values.imtVerificada}
          />
          <div className={gridClass}>
            <TextField {...text("imtData")} label="Verificada em" inputMode="numeric" placeholder="dd/mm/aaaa" />
            <TextField {...text("imtReferencia")} label="Referência" placeholder="N.º de alvará ou licença" />
          </div>
        </div>

        <div className={subCardClass}>
          <CheckboxField
            name="rgpdAssinado"
            label="Contrato de tratamento de dados assinado"
            description="Contrato de subcontratação RGPD entre a empresa e a Mudaro (RNF-04)."
            defaultChecked={values.rgpdAssinado}
          />
          <div className={gridClass}>
            <TextField {...text("rgpdData")} label="Assinado em" inputMode="numeric" placeholder="dd/mm/aaaa" />
            <TextField {...text("rgpdVersao")} label="Versão do contrato" placeholder="Ex.: v1" />
          </div>
        </div>
      </Card>

      <Card title="Piloto">
        <div className={gridClass}>
          <SelectField {...text("regiao")} label="Região" options={REGIOES_PILOTO} placeholder="Selecionar" />
          <TextField
            {...text("origem")}
            label="Como chegou até nós"
            placeholder="Ex.: landing, indicação, contacto direto"
          />
        </div>
        <TextAreaField {...text("notas")} label="Notas internas" placeholder="Só visíveis para a equipa Mudaro" />
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CheckboxField name="enviarConvite" label="Enviar o convite por email agora" defaultChecked={values.enviarConvite} />
        <div className="flex gap-3">
          <ButtonLink href={ROUTES.empresas.list} variant="secondary">
            Cancelar
          </ButtonLink>
          <Button type="submit" disabled={isPending}>
            {isPending ? "A criar..." : "Criar empresa"}
          </Button>
        </div>
      </div>
    </form>
  );
}
