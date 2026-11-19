import type { ReactNode } from "react";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  name: string;
  legend: ReactNode;
  options: readonly Option<T>[];
  value: T | "";
  onChange: (value: T) => void;
  /** "chip": píldoras sueltas. "segment": una sola barra de 48 px. */
  variant: "chip" | "segment";
  error?: string;
};

const focusRing =
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary";

/** Grupo de opciones con radios nativos: se envía con el formulario y se maneja con teclado. */
export function ChoiceGroup<T extends string>({ name, legend, options, value, onChange, variant, error }: Props<T>) {
  const isSegment = variant === "segment";

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 p-0 text-sm font-bold">{legend}</legend>
      <div className={isSegment ? "flex h-12 gap-1 rounded-xl border border-field-border bg-surface p-1" : "flex flex-wrap gap-1.5"}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`cursor-pointer ${isSegment ? "flex flex-1 rounded-lg" : "rounded-full"} ${focusRing}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={
                  isSegment
                    ? `grid flex-1 place-items-center rounded-lg text-sm font-bold ${checked ? "bg-foreground text-background" : "text-foreground"}`
                    : `inline-flex h-10 items-center rounded-full border px-3.5 text-sm font-bold ${
                        checked
                          ? "border-foreground bg-foreground text-background"
                          : "border-status-off-border bg-surface text-foreground hover:bg-surface-soft"
                      }`
                }
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <span role="alert" className="text-[13px] font-medium text-danger-foreground">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}
