import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "text";
type Size = "sm" | "md" | "lg";

type StyleProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
};

const BASE =
  "box-border inline-flex cursor-pointer items-center justify-center gap-2 font-bold no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-70";

const VARIANT: Record<Exclude<Variant, "text">, string> = {
  primary: "border-0 bg-primary text-primary-foreground",
  secondary: "border border-field-border bg-surface text-foreground",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 whitespace-nowrap rounded-lg px-3 text-[13px]",
  md: "h-11 rounded-[10px] text-[15px]",
  lg: "h-12 rounded-[10px] text-[15px]",
};

// Una sola acción primaria (naranja) por vista; el resto, secundarias.
export function buttonClass({ variant = "primary", size = "md", fullWidth = false, className = "" }: StyleProps = {}) {
  if (variant === "text") {
    return `cursor-pointer border-0 bg-transparent p-2 text-sm font-medium text-foreground underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground ${className}`.trim();
  }
  const padding = size === "sm" ? "" : variant === "primary" ? "px-5" : "px-[18px]";
  return [BASE, VARIANT[variant], SIZE[size], padding, fullWidth ? "w-full" : "", className].filter(Boolean).join(" ");
}

type ButtonProps = Omit<ComponentProps<"button">, "className"> & StyleProps;

export function Button({ variant, size, fullWidth, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, fullWidth, className })} {...props} />;
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & StyleProps;

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, fullWidth, className })} {...props} />;
}
