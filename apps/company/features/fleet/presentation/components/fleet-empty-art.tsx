// Ilustración del estado vacío de Frota: un camión de Mudaro con cajas y una ruta hacia un destino.
// Decorativa. Los colores salen de los tokens (y el sombreado, de capas negras o claras translúcidas)
// para que siga bien en el tema oscuro.

const BOX = (
  <>
    <polygon points="100,30 40,62 100,94 160,62" className="fill-status-config-surface" />
    <polygon points="40,62 100,94 100,170 40,138" className="fill-accent" />
    <polygon points="100,94 160,62 160,138 100,170" className="fill-accent opacity-70" />
    <polygon points="64,49.2 76,42.8 136,74.8 124,81.2" className="fill-primary" />
    <polygon points="124,81.2 136,74.8 136,118 124,124.4" className="fill-primary" />
  </>
);

/** Capa clara translúcida: aclara el tinta en el tema claro y lo oscurece en el oscuro. */
const LIFT = "fill-background";

export function FleetEmptyArt() {
  return (
    <svg aria-hidden="true" width="480" height="300" viewBox="0 0 480 300" className="max-w-full flex-none">
      <circle cx="300" cy="138" r="138" className="fill-background" />
      <ellipse cx="250" cy="262" rx="212" ry="14" className="fill-line-soft" />
      {/* ruta con destino */}
      <path d="M150 282 C 220 300, 290 252, 352 282 S 432 292, 452 266" fill="none" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" className="stroke-primary" />
      <path d="M452 268 C 445 257 438 250 438 242 a14 14 0 1 1 28 0 c0 8 -7 15 -14 26 Z" className="fill-primary" />
      <circle cx="452" cy="242" r="5" className="fill-background" />
      {/* caja de carga */}
      <rect x="70" y="50" width="242" height="170" rx="12" className="fill-foreground" />
      <rect x="70" y="50" width="242" height="18" rx="9" className={`${LIFT} opacity-10`} />
      <polygon points="70,150 70,220 160,220" className="fill-primary" />
      <polygon points="70,136 70,150 160,220 178,220" className="fill-background" />
      <polygon points="312,96 312,160 248,220 220,220" className={`${LIFT} opacity-15`} />
      <g transform="translate(166,70) scale(0.28)">
        <polygon points="100,30 40,62 100,94 160,62" className="fill-background" />
        <polygon points="40,62 100,94 100,170 40,138" className="fill-accent" />
        <polygon points="100,94 160,62 160,138 100,170" className="fill-accent opacity-70" />
        <polygon points="50.8,136.2 50.8,86.8 70,119.8 89.2,107.2 89.2,156.6 79.6,151.5 79.6,124.9 70,132.7 60.4,114.7 60.4,141.3" className="fill-foreground" />
        <polygon points="64,49.2 76,42.8 136,74.8 124,81.2" className="fill-primary" />
        <polygon points="124,81.2 136,74.8 136,118 124,124.4" className="fill-primary" />
      </g>
      <text x="200" y="146" textAnchor="middle" fontFamily="var(--font-bricolage)" fontWeight="800" fontSize="36" letterSpacing="-1" className="fill-background">
        MUDARO
      </text>
      <rect x="70" y="212" width="242" height="12" className="fill-foreground" />
      {/* cabina */}
      <path d="M312 98 H368 Q384 98 392 112 L422 168 V222 H312 Z" className="fill-primary" />
      <path d="M324 112 H364 Q372 112 377 121 L398 160 H324 Z" className="fill-foreground" />
      <path d="M324 112 H364 Q372 112 377 121 L398 160 H324 Z" className={`${LIFT} opacity-15`} />
      <path d="M330 118 L346 118 L332 150 Z" className={`${LIFT} opacity-25`} />
      <rect x="396" y="116" width="7" height="26" rx="3" className="fill-foreground" />
      <path d="M318 172 H404" strokeWidth="3" strokeLinecap="round" className="stroke-black/15" />
      <rect x="374" y="178" width="18" height="5" rx="2.5" className="fill-foreground" />
      <rect x="408" y="180" width="14" height="14" rx="4" className="fill-background" />
      <rect x="300" y="214" width="128" height="14" rx="7" className="fill-foreground" />
      {/* ruedas */}
      {[132, 362].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="232" r="27" className="fill-foreground" />
          <circle cx={cx} cy="232" r="12" className="fill-background" />
          <circle cx={cx} cy="232" r="5" className="fill-foreground" />
        </g>
      ))}
      {/* cajas */}
      <g transform="translate(-14,166) scale(0.55)">
        {BOX}
        <polygon points="50.8,136.2 50.8,86.8 70,119.8 89.2,107.2 89.2,156.6 79.6,151.5 79.6,124.9 70,132.7 60.4,114.7 60.4,141.3" className="fill-foreground opacity-85" />
      </g>
      <g transform="translate(52,196) scale(0.42)">{BOX}</g>
    </svg>
  );
}

/** Iconos de 52 px de las tres ventajas (caja con capacidad, moneda, calendario). */
export function PerkIcon({ name }: { name: "capacity" | "costs" | "schedule" }) {
  return (
    <svg aria-hidden="true" width="52" height="52" viewBox="0 0 52 52" className="flex-none">
      {name === "capacity" ? (
        <>
          <path d="M26 6 L44 16 V36 L26 46 L8 36 V16 Z" fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-foreground" />
          <path d="M26 26 L44 16 V36 L26 46 Z" className="fill-primary" />
          <path d="M8 16 L26 26 L44 16 M26 26 V46" fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-foreground" />
        </>
      ) : name === "costs" ? (
        <>
          <circle cx="26" cy="26" r="21" fill="none" strokeWidth="3" className="stroke-foreground" />
          <path d="M32 17.5 A10 10 0 1 0 32 34.5" fill="none" strokeWidth="3.4" strokeLinecap="round" className="stroke-primary" />
          <path d="M15 23.5 H28 M15 28.5 H26" strokeWidth="3" strokeLinecap="round" className="stroke-primary" />
        </>
      ) : (
        <>
          <rect x="6" y="10" width="40" height="36" rx="6" fill="none" strokeWidth="3" className="stroke-foreground" />
          <path d="M6 20 H46 M17 5 V14 M35 5 V14" strokeWidth="3" strokeLinecap="round" className="stroke-foreground" />
          {[
            [14, 26],
            [23, 26],
            [32, 26],
            [14, 35],
            [23, 35],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="6" height="5" rx="1.5" className="fill-primary" />
          ))}
        </>
      )}
    </svg>
  );
}
