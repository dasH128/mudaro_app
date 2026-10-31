"use client";

type Option = { value: string; label: string };
type Group = { label: string; options: readonly Option[] };

type Props = {
  name: string;
  value: string;
  options: readonly Option[];
  groups: readonly Group[];
};

// Único trozo de cliente de la barra: envía el formulario al cambiar el filtro, sin botón.
export function ShowSelect({ name, value, options, groups }: Props) {
  return (
    <select
      name={name}
      defaultValue={value}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className="max-w-44 cursor-pointer bg-transparent text-sm font-bold text-foreground outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-surface text-foreground">
          {option.label}
        </option>
      ))}
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label} className="bg-surface text-foreground">
          {group.options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface text-foreground">
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
