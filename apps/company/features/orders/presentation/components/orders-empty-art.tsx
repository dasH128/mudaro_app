// Ilustración del estado vacío de Pedidos: la ficha de un pedido con su lista y cajas delante, y una ruta hacia el destino.
// Decorativa. Los colores salen de los tokens (y el sombreado, de capas claras translúcidas) para que siga bien en el tema oscuro.

const BOX = (
  <>
    <polygon points="100,30 40,62 100,94 160,62" className="fill-status-config-surface" />
    <polygon points="40,62 100,94 100,170 40,138" className="fill-accent" />
    <polygon points="100,94 160,62 160,138 100,170" className="fill-accent opacity-70" />
    <polygon points="64,49.2 76,42.8 136,74.8 124,81.2" className="fill-primary" />
    <polygon points="124,81.2 136,74.8 136,118 124,124.4" className="fill-primary" />
  </>
);

const ROWS = [112, 148, 184] as const;

export function OrdersEmptyArt() {
  return (
    <svg aria-hidden="true" width="480" height="300" viewBox="0 0 480 300" className="max-w-full flex-none">
      <circle cx="300" cy="138" r="138" className="fill-background" />
      <ellipse cx="250" cy="262" rx="212" ry="14" className="fill-line-soft" />
      {/* ruta con destino */}
      <path d="M150 282 C 220 300, 290 252, 352 282 S 432 292, 452 266" fill="none" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" className="stroke-primary" />
      <path d="M452 268 C 445 257 438 250 438 242 a14 14 0 1 1 28 0 c0 8 -7 15 -14 26 Z" className="fill-primary" />
      <circle cx="452" cy="242" r="5" className="fill-background" />
      {/* ficha del pedido */}
      <rect x="150" y="30" width="236" height="206" rx="16" className="fill-foreground" />
      <rect x="150" y="30" width="236" height="22" rx="11" className="fill-background opacity-10" />
      <rect x="174" y="64" width="66" height="22" rx="11" className="fill-primary" />
      <rect x="252" y="70" width="76" height="10" rx="5" className="fill-background opacity-30" />
      {ROWS.map((y, index) => (
        <g key={y}>
          {index < 2 ? (
            <>
              <circle cx="190" cy={y} r="12" className="fill-primary" />
              <path d={`M184 ${y} l4.5 4.5 L196 ${y - 5}`} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-foreground" />
            </>
          ) : (
            <circle cx="190" cy={y} r="11" fill="none" strokeWidth="2.5" strokeDasharray="4 4" className="stroke-background opacity-50" />
          )}
          <rect x="214" y={y - 5} width={index === 1 ? 104 : 140} height="10" rx="5" className={`fill-background ${index < 2 ? "opacity-40" : "opacity-20"}`} />
        </g>
      ))}
      {/* cajas */}
      <g transform="translate(-14,166) scale(0.55)">
        {BOX}
        <polygon points="50.8,136.2 50.8,86.8 70,119.8 89.2,107.2 89.2,156.6 79.6,151.5 79.6,124.9 70,132.7 60.4,114.7 60.4,141.3" className="fill-foreground opacity-85" />
      </g>
      <g transform="translate(52,196) scale(0.42)">{BOX}</g>
      <g transform="translate(328,176) scale(0.5)">{BOX}</g>
    </svg>
  );
}

/** Iconos de 52 px de las tres ventajas (persona, caja, documento con importe). */
export function PerkIcon({ name }: { name: "client" | "inventory" | "quote" }) {
  return (
    <svg aria-hidden="true" width="52" height="52" viewBox="0 0 52 52" className="flex-none">
      {name === "client" ? (
        <>
          <circle cx="26" cy="17" r="10" fill="none" strokeWidth="3" className="stroke-foreground" />
          <path d="M6 46 C 6 35, 15 30, 26 30 S 46 35, 46 46 Z" className="fill-primary" />
          <path d="M6 46 C 6 35, 15 30, 26 30 S 46 35, 46 46" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-foreground" />
        </>
      ) : name === "inventory" ? (
        <>
          <path d="M26 6 L44 16 V36 L26 46 L8 36 V16 Z" fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-foreground" />
          <path d="M26 26 L44 16 V36 L26 46 Z" className="fill-primary" />
          <path d="M8 16 L26 26 L44 16 M26 26 V46" fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-foreground" />
        </>
      ) : (
        <>
          <path d="M11 5 H33 L42 14 V47 H11 Z" fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-foreground" />
          <path d="M33 5 V14 H42" fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-foreground" />
          <path d="M18 22 H34 M18 29 H30" strokeWidth="3" strokeLinecap="round" className="stroke-foreground" />
          <circle cx="33" cy="38" r="7" className="fill-primary" />
        </>
      )}
    </svg>
  );
}
