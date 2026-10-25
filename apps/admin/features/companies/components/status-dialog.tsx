"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { TextField } from "@/app/components/form/fields";
import { Button } from "@/app/components/ui/button";
import { changeStatusAction } from "@/features/companies/actions/change-status";
import { IDLE } from "@/features/companies/actions/state";

type StatusDialogProps = {
  companyId: string;
  /** true: el botón desactiva la empresa. false: la reactiva. */
  deactivate: boolean;
};

const TITLE_ID = "estado-dialog-titulo";

export function StatusDialog({ companyId, deactivate }: StatusDialogProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // <dialog> nativo: foco atrapado, Esc para cerrar y foco de vuelta al botón.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button ref={triggerRef} variant="secondary" onClick={() => setOpen(true)}>
        {deactivate ? "Desativar empresa" : "Reativar empresa"}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={TITLE_ID}
        onClose={() => {
          setOpen(false);
          // Safari no enfoca los botones al hacer clic, así que el navegador no sabe a dónde devolver el foco.
          triggerRef.current?.focus();
        }}
        className="mx-auto mt-40 mb-auto w-full max-w-[460px] rounded-[18px] border-0 bg-surface p-7 text-foreground shadow-lg backdrop:bg-foreground/55"
      >
        {/* Solo se monta abierto: cada apertura empieza con el formulario limpio. */}
        {open && (
          <StatusForm
            companyId={companyId}
            deactivate={deactivate}
            onCancel={() => setOpen(false)}
            onDone={() => setOpen(false)}
          />
        )}
      </dialog>
    </>
  );
}

type StatusFormProps = StatusDialogProps & {
  onCancel: () => void;
  onDone: () => void;
};

function StatusForm({ companyId, deactivate, onCancel, onDone }: StatusFormProps) {
  const [state, action, pending] = useActionState(changeStatusAction.bind(null, companyId, deactivate), IDLE);

  useEffect(() => {
    if (state.status === "ok") onDone();
  }, [state, onDone]);

  const motivoError = state.status === "error" ? state.fieldErrors?.motivo : undefined;
  const generalError = state.status === "error" && !state.fieldErrors ? state.message : undefined;

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <h2 id={TITLE_ID} className="m-0 font-display text-2xl leading-[1.2] font-extrabold">
        {deactivate ? "Desativar empresa?" : "Reativar empresa?"}
      </h2>
      <p className="m-0 text-[15px] leading-[1.5] text-muted">
        {deactivate
          ? "Todos os utilizadores desta empresa deixam de conseguir entrar na app. Os dados mantêm-se e pode reativá-la depois."
          : "Os utilizadores voltam a poder entrar na app com as suas contas."}
      </p>

      {deactivate && (
        <TextField name="motivo" label="Motivo" required placeholder="Fica registado no histórico" error={motivoError} />
      )}
      {generalError && (
        <p role="alert" className="m-0 text-sm font-medium text-danger-foreground">
          {generalError}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "A guardar..." : deactivate ? "Desativar" : "Reativar"}
        </Button>
      </div>
    </form>
  );
}
