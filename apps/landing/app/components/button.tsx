import type { ReactNode } from "react";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const VARIANTS = {
  primary: "bg-primary text-primary-foreground",
  outline: "border-2 border-foreground text-foreground hover:bg-foreground/5",
  ink: "bg-foreground text-background",
} as const;

type ButtonLinkProps = {
  href: string;
  variant?: keyof typeof VARIANTS;
  children: ReactNode;
  className?: string;
};

export function ButtonLink({ href, variant = "primary", children, className = "" }: ButtonLinkProps) {
  return (
    <a href={href} className={`${BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </a>
  );
}
