"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { CheckboxField, TextField } from "@/app/components/form/fields";
import { Button } from "@/app/components/ui/button";
import type { CatalogGroup } from "../domain/types";

type Kind = "room" | "category";

type DialogState = { group: CatalogGroup | null } | null;

type GroupDialogContextValue = {
  open: (group: CatalogGroup | null) => void;
};

const GroupDialogContext = createContext<GroupDialogContextValue | null>(null);

function useGroupDialog() {
  const ctx = useContext(GroupDialogContext);
  if (!ctx) throw new Error("GroupDialogProvider em falta");
  return ctx;
}

const TITLE_ID = "group-dialog-title";

const COPY: Record<Kind, { title: string; ptPlaceholder: string; esPlaceholder: string; enPlaceholder: string; slug: string; icon: string }> = {
  room: { title: "Divisão", ptPlaceholder: "Ex.: Sala", esPlaceholder: "Ex.: Salón", enPlaceholder: "Ex.: Living room", slug: "living", icon: "sofa" },
  category: { title: "Categoria", ptPlaceholder: "Ex.: Sofás e cadeirões", esPlaceholder: "Ex.: Sofás y sillones", enPlaceholder: "Ex.: Sofas and armchairs", slug: "sofas", icon: "sofa" },
};

/** Guarda qué grupo se edita y monta el diálogo una sola vez para la página. */
export function GroupDialogProvider({ kind, children }: { kind: Kind; children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // <dialog> nativo: foco atrapado, Esc para cerrar.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (state && !dialog.open) dialog.showModal();
    if (!state && dialog.open) dialog.close();
  }, [state]);

  const open = (group: CatalogGroup | null) => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setState({ group });
  };

  return (
    <GroupDialogContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={TITLE_ID}
        onClose={() => {
          setState(null);
          // Safari no enfoca los botones al hacer clic, así que se devuelve el foco a mano.
          triggerRef.current?.focus();
        }}
        className="mx-auto mt-30 mb-auto w-full max-w-[560px] rounded-[18px] border-0 bg-surface p-7 text-foreground shadow-lg backdrop:bg-foreground/55"
      >
        {/* Solo se monta abierto: cada apertura empieza con el formulario limpio. */}
        {state && <GroupForm kind={kind} group={state.group} onClose={() => setState(null)} />}
      </dialog>
    </GroupDialogContext.Provider>
  );
}

export function NewGroupButton({ children }: { children: ReactNode }) {
  const { open } = useGroupDialog();
  return (
    <Button onClick={() => open(null)}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
      {children}
    </Button>
  );
}

export function EditGroupButton({ group }: { group: CatalogGroup }) {
  const { open } = useGroupDialog();
  return (
    <Button variant="secondary" size="sm" aria-label={`Editar ${group.pt}`} onClick={() => open(group)}>
      Editar
    </Button>
  );
}

type GroupFormProps = {
  kind: Kind;
  group: CatalogGroup | null;
  onClose: () => void;
};

function GroupForm({ kind, group, onClose }: GroupFormProps) {
  const copy = COPY[kind];
  // Solo diseño: "Guardar" todavía no guarda nada (sin Server Action ni Supabase).
  return (
    <form
      method="dialog"
      onSubmit={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="flex flex-col gap-[18px]"
    >
      <h2 id={TITLE_ID} className="m-0 font-display text-2xl font-extrabold">
        {copy.title}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <TextField name="pt" label="Nome em português" required placeholder={copy.ptPlaceholder} defaultValue={group?.pt} />
        <TextField name="es" label="Nome em espanhol" placeholder={copy.esPlaceholder} defaultValue={group?.es} />
        <TextField name="en" label="Nome em inglês" placeholder={copy.enPlaceholder} defaultValue={group?.en} />
        <TextField
          name="order"
          label="Ordem"
          placeholder="10"
          hint="Menor aparece primeiro."
          inputMode="numeric"
          defaultValue={group ? String(group.order) : undefined}
        />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <TextField
          name="slug"
          label="Slug"
          placeholder={copy.slug}
          hint="Gerado a partir do nome. Não muda depois de criado."
          defaultValue={group?.slug}
          readOnly={!!group}
        />
        <TextField
          name="icon"
          label="Ícone"
          placeholder={copy.icon}
          hint="Nome do ícone Lucide."
          defaultValue={group?.icon}
        />
      </div>
      <CheckboxField name="active" label="Ativa" defaultChecked />
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}
