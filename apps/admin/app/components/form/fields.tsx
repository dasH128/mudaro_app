import type { ChangeEventHandler, HTMLInputTypeAttribute, ReactNode, Ref } from "react";

export const controlClass =
  "box-border w-full rounded-[10px] border bg-surface px-3 text-foreground placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground";

const DEFAULT_SIZE = "h-11 text-[15px]";

const borderClass = (error?: string) => (error ? "border-danger-foreground" : "border-field-border");

type BaseProps = {
  /** Se usa como `id` y como `name` del control. */
  name: string;
  label: string;
  required?: boolean;
  /** Muestra el asterisco junto a la etiqueta. Por defecto, igual que `required`. */
  requiredMark?: boolean;
  hint?: string;
  error?: string;
};

function describedBy(name: string, hint?: string, error?: string) {
  const ids = [hint ? `${name}-ajuda` : null, error ? `${name}-erro` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

function FieldShell({ name, label, required, requiredMark = required, hint, error, children }: BaseProps & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-bold">
        {label}
        {requiredMark && (
          <span aria-hidden="true" className="text-muted">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <span id={`${name}-ajuda`} className="text-[13px] leading-[1.4] text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${name}-erro`} className="text-[13px] leading-[1.4] font-medium text-danger-foreground">
          {error}
        </span>
      )}
    </div>
  );
}

type TextFieldProps = BaseProps & {
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  /** Campo no controlado. Si se pasa `value`, el campo es controlado y se ignora. */
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  inputRef?: Ref<HTMLInputElement>;
  inputMode?: "numeric" | "tel" | "email" | "text";
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
  /** Sustituye la altura y el tamaño de texto por defecto (h-11 text-[15px]). */
  sizeClassName?: string;
};

export function TextField({
  type = "text",
  placeholder,
  defaultValue,
  value,
  onChange,
  inputRef,
  inputMode,
  autoComplete,
  maxLength,
  pattern,
  sizeClassName = DEFAULT_SIZE,
  ...base
}: TextFieldProps) {
  const { name, required, hint, error } = base;
  const valueProps = value === undefined ? { defaultValue } : { value, onChange };
  return (
    <FieldShell {...base}>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        {...valueProps}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        pattern={pattern}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={`${controlClass} ${sizeClassName} ${borderClass(error)}`}
      />
    </FieldShell>
  );
}

type SelectFieldProps = BaseProps & {
  options: readonly string[];
  placeholder: string;
  defaultValue?: string;
};

export function SelectField({ options, placeholder, defaultValue, ...base }: SelectFieldProps) {
  const { name, required, hint, error } = base;
  return (
    <FieldShell {...base}>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={`${controlClass} ${DEFAULT_SIZE} ${borderClass(error)}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type TextAreaFieldProps = BaseProps & {
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
};

export function TextAreaField({ placeholder, defaultValue, rows = 3, ...base }: TextAreaFieldProps) {
  const { name, required, hint, error } = base;
  return (
    <FieldShell {...base}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={`${controlClass} resize-y py-2.5 text-[15px] ${borderClass(error)}`}
      />
    </FieldShell>
  );
}

type CheckboxFieldProps = {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
};

export function CheckboxField({ name, label, description, defaultChecked }: CheckboxFieldProps) {
  return (
    <label className={`flex cursor-pointer gap-3 ${description ? "items-start" : "items-center"}`}>
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className={`size-5 shrink-0 accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${description ? "mt-0.5" : ""}`}
      />
      {description ? (
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-bold">{label}</span>
          <span className="text-[13px] leading-[1.45] text-muted">{description}</span>
        </span>
      ) : (
        <span className="text-[15px]">{label}</span>
      )}
    </label>
  );
}
