"use client";

type Props = {
  name: string;
  value: string;
  options: readonly { value: string; label: string }[];
};

// Único trozo de cliente de la barra: envía el formulario al cambiar el orden, sin botón.
export function SortSelect({ name, value, options }: Props) {
  return (
    <select
      name={name}
      defaultValue={value}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className="cursor-pointer bg-transparent text-sm font-bold text-foreground outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-surface text-foreground">
          {option.label}
        </option>
      ))}
    </select>
  );
}
