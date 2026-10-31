// Ilustración del estado vacío: un móvil con el trabajo del día, cajas y un rollo de cinta.
// Decorativa. Los colores salen de los tokens para que siga bien en el tema oscuro.

const BOX = (
  <>
    <polygon points="100,30 40,62 100,94 160,62" className="fill-status-config-surface" />
    <polygon points="40,62 100,94 100,170 40,138" className="fill-accent" />
    <polygon points="100,94 160,62 160,138 100,170" className="fill-accent opacity-70" />
    <polygon points="64,49.2 76,42.8 136,74.8 124,81.2" className="fill-primary" />
    <polygon points="124,81.2 136,74.8 136,118 124,124.4" className="fill-primary" />
  </>
);

export function TeamEmptyArt() {
  return (
    <svg aria-hidden="true" width="480" height="300" viewBox="0 0 480 300" className="max-w-full flex-none">
      <circle cx="260" cy="146" r="138" className="fill-background" />
      <ellipse cx="250" cy="276" rx="200" ry="12" className="fill-line-soft" />
      {/* móvil */}
      <rect x="186" y="26" width="148" height="252" rx="24" className="fill-foreground" />
      <rect x="196" y="44" width="128" height="216" rx="14" className="fill-background" />
      <rect x="240" y="33" width="40" height="5" rx="2.5" className="fill-muted" />
      {/* cartão do trabalho */}
      <rect x="204" y="56" width="112" height="98" rx="12" className="fill-surface" />
      <rect x="212" y="64" width="30" height="34" rx="8" className="fill-primary" />
      <text x="227" y="83" textAnchor="middle" fontFamily="var(--font-bricolage)" fontWeight="800" fontSize="14" className="fill-primary-foreground">
        31
      </text>
      <text x="227" y="93" textAnchor="middle" fontFamily="var(--font-dm-sans)" fontWeight="700" fontSize="7" className="fill-primary-foreground">
        OUT
      </text>
      <rect x="248" y="68" width="58" height="7" rx="3.5" className="fill-foreground" />
      <rect x="248" y="81" width="42" height="6" rx="3" className="fill-accent" />
      <path d="M214 112 C 236 104, 256 124, 278 112 S 300 108, 306 114" fill="none" strokeWidth="2.4" strokeDasharray="5 5" strokeLinecap="round" className="stroke-primary" />
      <circle cx="214" cy="112" r="4" className="fill-foreground" />
      <circle cx="306" cy="114" r="4" className="fill-primary" />
      <rect x="212" y="128" width="96" height="18" rx="9" className="fill-foreground" />
      <text x="260" y="140" textAnchor="middle" fontFamily="var(--font-dm-sans)" fontWeight="700" fontSize="8" className="fill-background">
        Começar recolha
      </text>
      {/* foto + assinatura */}
      <rect x="204" y="162" width="52" height="46" rx="10" className="fill-surface" />
      <rect x="216" y="176" width="28" height="20" rx="4" fill="none" strokeWidth="2.4" className="stroke-foreground" />
      <circle cx="230" cy="186" r="5" fill="none" strokeWidth="2.4" className="stroke-primary" />
      <rect x="264" y="162" width="52" height="46" rx="10" className="fill-surface" />
      <path d="M272 194 C 278 180, 284 200, 290 186 S 300 192, 308 182" fill="none" strokeWidth="2.4" strokeLinecap="round" className="stroke-foreground" />
      <path d="M272 200 H308" strokeWidth="2" strokeLinecap="round" className="stroke-accent" />
      {/* equipa */}
      <rect x="204" y="216" width="112" height="34" rx="10" className="fill-status-config-surface" />
      <circle cx="222" cy="233" r="9" className="fill-foreground" />
      <circle cx="238" cy="233" r="9" strokeWidth="2" className="fill-accent stroke-status-config-surface" />
      <circle cx="254" cy="233" r="9" strokeWidth="1.6" strokeDasharray="3 2.4" className="fill-surface stroke-field-border" />
      <path d="M254 229 V237 M250 233 H258" strokeWidth="1.8" strokeLinecap="round" className="stroke-foreground" />
      {/* caixas */}
      <g transform="translate(40,150) scale(0.66)">{BOX}</g>
      <g transform="translate(84,108) scale(0.42)">{BOX}</g>
      {/* rolo de fita */}
      <circle cx="400" cy="246" r="26" className="fill-primary" />
      <circle cx="400" cy="246" r="12" className="fill-background" />
      <circle cx="400" cy="246" r="6" className="fill-foreground" />
      <path d="M400 272 H446" strokeWidth="8" strokeLinecap="round" className="stroke-primary" />
    </svg>
  );
}

const PERK_ICON = "flex-none";

/** Iconos de 52 px de las tres ventajas (móvil, cámara, candado). */
export function PerkIcon({ name }: { name: "phone" | "photos" | "prices" }) {
  return (
    <svg aria-hidden="true" width="52" height="52" viewBox="0 0 52 52" className={PERK_ICON}>
      {name === "phone" ? (
        <>
          <rect x="14" y="4" width="24" height="44" rx="5" fill="none" strokeWidth="3" className="stroke-foreground" />
          <rect x="19" y="12" width="14" height="10" rx="2" className="fill-primary" />
          <path d="M19 28 H33 M19 34 H29" strokeWidth="3" strokeLinecap="round" className="stroke-foreground" />
        </>
      ) : name === "photos" ? (
        <>
          <rect x="5" y="13" width="42" height="30" rx="6" fill="none" strokeWidth="3" className="stroke-foreground" />
          <path d="M18 13 L21 7 H31 L34 13" fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-foreground" />
          <circle cx="26" cy="28" r="8" fill="none" strokeWidth="3.4" className="stroke-primary" />
        </>
      ) : (
        <>
          <rect x="9" y="22" width="34" height="25" rx="5" fill="none" strokeWidth="3" className="stroke-foreground" />
          <path d="M16 22 V15 a10 10 0 0 1 20 0 V22" fill="none" strokeWidth="3" className="stroke-foreground" />
          <circle cx="26" cy="33" r="3.5" className="fill-primary" />
          <path d="M26 36 V40" strokeWidth="3" strokeLinecap="round" className="stroke-primary" />
        </>
      )}
    </svg>
  );
}
