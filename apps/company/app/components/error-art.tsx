// Ilustraciones de las pantallas de error: cajas de cartón. Decorativas (aria-hidden).
// Los colores salen de los tokens para que sigan bien en el tema oscuro, como en los estados de primer uso.

/** Caja abierta y vacía con una interrogación encima: lo que buscabas no está (p. ej. un pedido). */
export function EmptyBoxArt() {
  return (
    <svg aria-hidden="true" width="200" height="170" viewBox="0 0 200 170" className="max-w-full">
      <ellipse cx="100" cy="158" rx="78" ry="8" className="fill-line-soft" />
      {/* solapas traseras abiertas */}
      <polygon points="40,72 100,40 82,20 22,52" className="fill-accent opacity-80" />
      <polygon points="100,40 160,72 178,52 118,20" className="fill-accent opacity-60" />
      {/* interior vacío */}
      <polygon points="100,40 40,72 100,104 160,72" className="fill-foreground opacity-80" />
      {/* caras */}
      <polygon points="40,72 100,104 100,156 40,124" className="fill-accent" />
      <polygon points="100,104 160,72 160,124 100,156" className="fill-accent opacity-70" />
      <text x="100" y="18" textAnchor="middle" fontSize="26" fontWeight="800" className="fill-primary font-display">
        ?
      </text>
    </svg>
  );
}

/** Caja tumbada con la cinta rota: algo falló al cargar. */
export function TippedBoxArt() {
  return (
    <svg aria-hidden="true" width="200" height="170" viewBox="0 0 200 170" className="max-w-full">
      <ellipse cx="100" cy="158" rx="78" ry="8" className="fill-line-soft" />
      <g transform="rotate(-14 100 95)">
        <polygon points="100,26 40,58 100,90 160,58" className="fill-status-config-surface" />
        <polygon points="40,58 100,90 100,156 40,124" className="fill-accent" />
        <polygon points="100,90 160,58 160,124 100,156" className="fill-accent opacity-70" />
        {/* cinta rasgada: dos trozos con el borde en zigzag */}
        <polygon points="64,45.2 76,38.8 94,48.4 88,56 96,60 82,65.2" className="fill-primary" />
        <polygon points="108,60 114,56.6 136,70.8 124,77.2 104,66.4 112,63.6" className="fill-primary" />
      </g>
      <circle cx="170" cy="150" r="5" className="fill-accent" />
      <circle cx="184" cy="141" r="3" className="fill-accent opacity-70" />
    </svg>
  );
}

/** Caja cerrada con candado: la empresa no tiene acceso. */
export function LockedBoxArt() {
  return (
    <svg aria-hidden="true" width="160" height="136" viewBox="0 0 200 170" className="max-w-full">
      <ellipse cx="100" cy="158" rx="78" ry="8" className="fill-line-soft" />
      <polygon points="100,22 40,54 100,86 160,54" className="fill-status-config-surface" />
      <polygon points="40,54 100,86 100,156 40,124" className="fill-accent" />
      <polygon points="100,86 160,54 160,124 100,156" className="fill-accent opacity-70" />
      <polygon points="64,41.2 76,34.8 136,66.8 124,73.2" className="fill-primary" />
      {/* candado */}
      <path d="M117 100 V90 a13 13 0 0 1 26 0 V100" fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-foreground" />
      <rect x="110" y="98" width="40" height="32" rx="7" className="fill-foreground" />
      <circle cx="130" cy="112" r="4" className="fill-primary" />
    </svg>
  );
}

/** Credencial tachada: la cuenta del usuario está desactivada. */
export function RevokedBadgeArt() {
  return (
    <svg aria-hidden="true" width="160" height="136" viewBox="0 0 200 170" className="max-w-full">
      <ellipse cx="100" cy="158" rx="70" ry="8" className="fill-line-soft" />
      <rect x="58" y="22" width="84" height="124" rx="14" className="fill-accent" />
      <rect x="86" y="30" width="28" height="8" rx="4" className="fill-background opacity-70" />
      <circle cx="100" cy="72" r="18" className="fill-status-config-surface" />
      <rect x="74" y="102" width="52" height="8" rx="4" className="fill-status-config-surface" />
      <rect x="82" y="118" width="36" height="6" rx="3" className="fill-status-config-surface" />
      <path d="M48 140 L152 36" strokeWidth="9" strokeLinecap="round" className="stroke-primary" />
    </svg>
  );
}

/** Telemóvel con la app: el operario trabaja desde la app móvil. */
export function MobileAppArt() {
  return (
    <svg aria-hidden="true" width="160" height="136" viewBox="0 0 200 170" className="max-w-full">
      <ellipse cx="100" cy="158" rx="62" ry="8" className="fill-line-soft" />
      <rect x="66" y="14" width="68" height="136" rx="14" className="fill-foreground" />
      <rect x="73" y="28" width="54" height="104" rx="6" className="fill-background" />
      <rect x="81" y="40" width="38" height="10" rx="5" className="fill-primary" />
      <rect x="81" y="58" width="38" height="18" rx="4" className="fill-accent" />
      <rect x="81" y="82" width="38" height="18" rx="4" className="fill-accent opacity-70" />
      <rect x="81" y="106" width="26" height="6" rx="3" className="fill-status-config-surface" />
      <circle cx="100" cy="141" r="3.5" className="fill-background" />
    </svg>
  );
}

/** Caja cerrada con una interrogación en un lateral: la página no existe. */
export function UnknownBoxArt() {
  return (
    <svg aria-hidden="true" width="200" height="170" viewBox="0 0 200 170" className="max-w-full">
      <ellipse cx="100" cy="158" rx="78" ry="8" className="fill-line-soft" />
      <polygon points="100,22 40,54 100,86 160,54" className="fill-status-config-surface" />
      <polygon points="40,54 100,86 100,156 40,124" className="fill-accent" />
      <polygon points="100,86 160,54 160,124 100,156" className="fill-accent opacity-70" />
      {/* cinta del cierre */}
      <polygon points="64,41.2 76,34.8 136,66.8 124,73.2" className="fill-primary" />
      <polygon points="124,73.2 136,66.8 136,104 124,110.4" className="fill-primary" />
      <text x="70" y="128" textAnchor="middle" fontSize="34" fontWeight="800" className="fill-foreground font-display">
        ?
      </text>
    </svg>
  );
}
