type MudaroSymbolProps = {
  /** `dark`: caja tinta, para fondo claro. `light`: caja cartón y kraft, para fondo tinta. */
  variant?: "dark" | "light";
  className?: string;
};

const PALETTES = {
  dark: { top: "#252A4E", left: "#1B1F3B", right: "#2E3460", edge: "#F3E9D8", letter: "#F3E9D8", core: "#1B1F3B" },
  light: { top: "#E2D2B8", left: "#F3E9D8", right: "#C8A27A", edge: "#1B1F3B", letter: "#1B1F3B", core: "#1B1F3B" },
} as const;

// Colores hex permitidos aquí: es el logo oficial (DESIGN.md §2), no un componente de UI.
export function MudaroSymbol({ variant = "dark", className }: MudaroSymbolProps) {
  const c = PALETTES[variant];
  return (
    <svg viewBox="30 4 140 170" role="img" aria-label="Mudaro" className={className}>
      <polygon points="100,30 40,62 100,94 160,62" fill={c.top} />
      <polygon points="40,62 100,94 100,170 40,138" fill={c.left} />
      <polygon points="100,94 160,62 160,138 100,170" fill={c.right} />
      <path d="M40 62 L100 94 L160 62" fill="none" stroke={c.edge} strokeWidth="3" strokeLinejoin="round" />
      <polygon points="50.8,136.2 50.8,86.8 70,119.8 89.2,107.2 89.2,156.6 79.6,151.5 79.6,124.9 70,132.7 60.4,114.7 60.4,141.3" fill={c.letter} />
      <polygon points="64,49.2 76,42.8 136,74.8 124,81.2" fill="#FF5B14" />
      <polygon points="124,81.2 136,74.8 136,118 133,121.5 130,118.6 127,122.6 124,124.4" fill="#FF5B14" />
      <polygon points="124,81.2 136,74.8 136,118 133,121.5 130,118.6 127,122.6 124,124.4" fill="#000" opacity="0.18" />
      <g fill="#FF5B14">
        <circle cx="61" cy="31" r="20" />
        <circle cx="63" cy="30" r="20" />
        <circle cx="65" cy="29" r="20" />
      </g>
      <g fill="#000" opacity="0.22">
        <circle cx="61" cy="31" r="20" />
        <circle cx="63" cy="30" r="20" />
        <circle cx="65" cy="29" r="20" />
      </g>
      <circle cx="67" cy="28" r="20" fill="#FF5B14" />
      <circle cx="67" cy="28" r="9" fill="#F3E9D8" />
      <circle cx="67" cy="28" r="5" fill={c.core} />
    </svg>
  );
}
