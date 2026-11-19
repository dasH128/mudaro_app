import { inputClass } from "@mudaro/ui";
import { Icon } from "@mudaro/ui";
import { EXTRA_NOTE_MAX, type ChosenExtras, type ExtraType } from "@mudaro/inventory";
import type { InventoryText } from "../inventory-text";

type Props = {
  t: InventoryText;
  extras: readonly ExtraType[];
  chosen: ChosenExtras;
  onToggle: (id: string) => void;
  onNote: (id: string, note: string) => void;
};

// Tipos del catálogo de Mudaro (RF-24): se marcan como referencia, sin precio ni cantidad.
// Cada empresa los convierte en sus servicios al presupuestar. No marcar nada también es válido.
export function ExtrasStep({ t, extras, chosen, onToggle, onNote }: Props) {
  const e = t.extras;

  return (
    <section aria-labelledby="inventory-extras" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2 id="inventory-extras" className="font-display text-[22px] font-extrabold">
          {e.title}
        </h2>
        <p className="text-sm text-muted">{e.subtitle}</p>
      </div>

      {extras.length === 0 ? <p className="text-sm text-muted">{e.empty}</p> : null}

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
        {extras.map((extra) => {
          const note = chosen[extra.id];
          const on = note !== undefined;
          const noteId = `extra-note-${extra.id}`;
          return (
            <div
              key={extra.id}
              className={`flex flex-col gap-3 rounded-[18px] p-4.5 ${on ? "border-2 border-foreground bg-surface" : "border border-line bg-surface-soft"}`}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onToggle(extra.id)}
                className="flex cursor-pointer flex-col items-start gap-1.5 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="flex w-full items-center justify-between gap-2.5">
                  <span className="text-[15px] font-bold">{extra.name}</span>
                  <span
                    aria-hidden="true"
                    className={`grid size-6 flex-none place-items-center rounded-lg ${
                      on ? "bg-foreground text-background" : "border-2 border-field-border bg-surface"
                    }`}
                  >
                    {on ? <Icon name="check" size={14} strokeWidth={3} /> : null}
                  </span>
                </span>
                {extra.description ? <span className="text-[13px] text-muted">{extra.description}</span> : null}
              </button>

              {on ? (
                <label htmlFor={noteId} className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold">
                    {e.noteLabel}
                    <span className="sr-only"> · {extra.name}</span>
                  </span>
                  <input
                    id={noteId}
                    type="text"
                    value={note}
                    maxLength={EXTRA_NOTE_MAX}
                    placeholder={e.notePlaceholder}
                    onChange={(event) => onNote(extra.id, event.target.value)}
                    className={inputClass}
                  />
                </label>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="text-[13px] text-muted">{e.footnote}</p>
    </section>
  );
}
