"use client";

import { useActionState, useState } from "react";

// Interruptor Ativo/Inativo de los paneles laterales (Frota y Equipa). Activar se guarda al pulsar; desactivar pide
// antes el motivo, porque lo inactivo deja de salir en la agenda. La acción de servidor la pone cada feature.

type State<E extends string> = { status: "idle" } | { status: "error"; formError: E };

type Props<E extends string, R extends string> = {
  action: (previous: State<E>, formData: FormData) => Promise<State<E>>;
  /** Campos ocultos que la acción necesita (idioma e id). */
  fields: Record<string, string>;
  active: boolean;
  /** Motivos de desactivación, en orden; el primero sale marcado. */
  reasons: readonly { value: R; label: string }[];
  t: {
    on: string;
    off: string;
    /** "Desativar Camião 1" y "Ativar Camião 1", ya con el nombre. */
    deactivateLabel: string;
    activateLabel: string;
    title: string;
    note: string;
    confirm: string;
    cancel: string;
    formErrors: Record<E, string>;
  };
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const secondary = `inline-flex h-9 cursor-pointer items-center rounded-full border border-field-border bg-surface px-4 text-[13px] font-bold text-foreground ${focusRing}`;
const primary = `inline-flex h-9 cursor-pointer items-center rounded-full bg-foreground px-4 text-[13px] font-bold text-background disabled:cursor-wait disabled:opacity-70 ${focusRing}`;

function Hidden({ fields }: { fields: Record<string, string> }) {
  return Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />);
}

/** Quien lo usa le pone `key` con el estado, para que la pregunta del motivo se cierre al cambiar. */
export function ActiveSwitch<E extends string, R extends string>({ action, fields, active, reasons, t }: Props<E, R>) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as State<E>);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState<R | undefined>(reasons[0]?.value);

  return (
    <div className="flex w-full flex-col gap-3">
      <form
        action={formAction}
        className="flex justify-end"
        onSubmit={(event) => {
          // Desactivar no se envía todavía: primero se pide el motivo
          if (active) {
            event.preventDefault();
            setAsking(true);
          }
        }}
      >
        <Hidden fields={fields} />
        <input type="hidden" name="active" value="true" />
        <button
          type="submit"
          role="switch"
          aria-checked={active}
          aria-label={active ? t.deactivateLabel : t.activateLabel}
          aria-expanded={active ? asking : undefined}
          disabled={pending}
          className={`inline-flex h-9 cursor-pointer items-center gap-2.5 pr-0.5 pl-2 text-[13px] font-bold text-foreground disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
        >
          {active ? t.on : t.off}
          <span className={`relative h-7 w-11.5 flex-none rounded-full ${active ? "bg-foreground" : "bg-status-off-border"}`}>
            <span className={`absolute top-1 size-5 rounded-full ${active ? "left-5.5 bg-background" : "left-1 bg-surface"}`} />
          </span>
        </button>
      </form>

      {active && asking ? (
        <form action={formAction} className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface p-3.5">
          <Hidden fields={fields} />
          <input type="hidden" name="active" value="false" />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold">{t.title}</legend>
            {reasons.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                  className="size-4 accent-foreground"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <p className="text-xs leading-snug text-muted">{t.note}</p>
          <span className="flex justify-end gap-2">
            <button type="button" className={secondary} onClick={() => setAsking(false)}>
              {t.cancel}
            </button>
            <button type="submit" className={primary} disabled={pending}>
              {t.confirm}
            </button>
          </span>
        </form>
      ) : null}

      {state.status === "error" ? (
        <p role="alert" className="text-[13px] font-bold text-danger-foreground">
          {t.formErrors[state.formError]}
        </p>
      ) : null}
    </div>
  );
}
