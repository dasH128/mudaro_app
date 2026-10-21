# DESIGN.md · Mudaro

Guía de diseño de la app web de Mudaro (Next.js 16.4 + Tailwind v4). Es la fuente de verdad para cualquier persona o agente de IA que cree o modifique interfaz en este repositorio. Si algo de este documento entra en conflicto con `app/globals.css`, manda `globals.css` y hay que actualizar este archivo.

## 1. Marca

- **Nombre:** MUDARO (en mayúsculas en el logotipo; "Mudaro" en texto corrido).
- **Qué es:** un servicio para que personas y negocios hagan su mudanza sin complicaciones.
- **Lema principal:** "Tu mudanza, en buenas manos".
- **Personalidad:** cercana, clara, con energía. Llamativa en los detalles (naranja, cinta), tranquila en la estructura (mucho espacio, fondos cartón y tinta).
- **Metáfora visual:** la caja de mudanza y la cinta de embalar. La caja es el orden y el cuidado; la cinta es el movimiento.

## 2. Logo

### Piezas

| Pieza | Descripción | Uso |
|---|---|---|
| Símbolo | Caja isométrica tinta con una M color cartón en la cara frontal y un rollo de cinta naranja en la tapa; la cinta sella la tapa y baja por el lateral derecho | Icono de app, favicon, avatar de redes |
| Logotipo | "MUDARO" en Bricolage Grotesque ExtraBold, tracking negativo | Cabecera, documentos |
| Lockup vertical | Símbolo encima del logotipo, lema debajo | Portada, pantallas de carga, marketing |
| Lockup horizontal | Símbolo a la izquierda del logotipo | Header de la web y de la app |

Los archivos van en `public/brand/` (pendiente de exportar desde el diseño):

```
public/brand/
  mudaro-symbol.svg
  mudaro-symbol-light.svg      # versión para fondo tinta
  mudaro-symbol-mono.svg       # un solo color
  mudaro-lockup-horizontal.svg
  mudaro-lockup-vertical.svg
  favicon.svg
```

### Versiones de color del símbolo

| Fondo | Caja | M | Cinta |
|---|---|---|---|
| Cartón / blanco | Tinta | Cartón | Naranja |
| Tinta | Cartón y kraft | Tinta | Naranja |
| Naranja | Tinta | Cartón | Cartón (nunca naranja sobre naranja) |
| Kraft | Tinta | Cartón | Naranja |

### Reglas

- Área de respeto mínima alrededor del logo: la altura de la "M" del logotipo.
- Tamaño mínimo del símbolo: 24 px. Por debajo de 32 px se usa la versión sin sombra en la cinta.
- No rotar, no estirar, no cambiar la tipografía del logotipo, no añadir sombras ni degradados.
- No colocar la cinta tapando la M.
- No usar el logo sobre fotos sin una capa de fondo sólido.

### Símbolo de referencia (SVG)

Usar como base del componente `<MudaroSymbol />`:

```svg
<svg viewBox="30 4 140 170" role="img" aria-label="Mudaro">
  <polygon points="100,30 40,62 100,94 160,62" fill="#252A4E"/>
  <polygon points="40,62 100,94 100,170 40,138" fill="#1B1F3B"/>
  <polygon points="100,94 160,62 160,138 100,170" fill="#2E3460"/>
  <path d="M40 62 L100 94 L160 62" fill="none" stroke="#F3E9D8" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="50.8,136.2 50.8,86.8 70,119.8 89.2,107.2 89.2,156.6 79.6,151.5 79.6,124.9 70,132.7 60.4,114.7 60.4,141.3" fill="#F3E9D8"/>
  <polygon points="64,49.2 76,42.8 136,74.8 124,81.2" fill="#FF5B14"/>
  <polygon points="124,81.2 136,74.8 136,118 133,121.5 130,118.6 127,122.6 124,124.4" fill="#FF5B14"/>
  <polygon points="124,81.2 136,74.8 136,118 133,121.5 130,118.6 127,122.6 124,124.4" fill="#000" opacity="0.18"/>
  <g fill="#FF5B14"><circle cx="61" cy="31" r="20"/><circle cx="63" cy="30" r="20"/><circle cx="65" cy="29" r="20"/></g>
  <g fill="#000" opacity="0.22"><circle cx="61" cy="31" r="20"/><circle cx="63" cy="30" r="20"/><circle cx="65" cy="29" r="20"/></g>
  <circle cx="67" cy="28" r="20" fill="#FF5B14"/>
  <circle cx="67" cy="28" r="9" fill="#F3E9D8"/>
  <circle cx="67" cy="28" r="5" fill="#1B1F3B"/>
</svg>
```

## 3. Color

### Colores de marca (primitivos)

Nunca se usan directamente en componentes. Solo se referencian desde los tokens semánticos.

| Token | Hex | Nombre |
|---|---|---|
| `--mudaro-naranja` | `#FF5B14` | Naranja Mudaro |
| `--mudaro-tinta` | `#1B1F3B` | Tinta |
| `--mudaro-carton` | `#F3E9D8` | Cartón |
| `--mudaro-kraft` | `#C8A27A` | Kraft |

### Tokens semánticos

Son los únicos colores que deben aparecer en el código de la UI, siempre vía utilidades de Tailwind (`bg-primary`, `text-foreground`…).

| Token | Claro | Oscuro | Para qué |
|---|---|---|---|
| `background` | Cartón `#F3E9D8` | Tinta `#1B1F3B` | Fondo de página |
| `surface` | `#FFFFFF` | `#252A4E` | Tarjetas, modales, inputs |
| `foreground` | Tinta | Cartón | Texto principal |
| `muted` | `#4A4E68` | `#C9CCDD` | Texto secundario |
| `primary` | Naranja | Naranja | Acción principal, foco, cinta gráfica |
| `primary-foreground` | Tinta | Tinta | Texto sobre `primary` |
| `accent` | Kraft | Kraft | Ilustraciones, etiquetas, fondos de apoyo |
| `border` | Tinta al 15 % | Cartón al 15 % | Bordes y separadores |

Estados (pendientes de validar con el diseño): `success #1F8A5B`, `warning #E0A100`, `danger #C62828`. Cualquier nuevo color se añade primero aquí y en `globals.css`.

### Contraste (WCAG 2.x, calculado)

| Combinación | Ratio | Regla |
|---|---|---|
| Tinta sobre cartón | ~13:1 | OK para cualquier texto |
| Tinta sobre naranja | ~5,2:1 | OK, es el estilo del botón primario |
| Naranja sobre tinta | ~5,2:1 | OK para enlaces en modo oscuro |
| Tinta sobre kraft | ~6,8:1 | OK |
| Blanco sobre naranja | ~3,1:1 | Solo texto ≥ 24 px o negrita ≥ 19 px |
| Naranja sobre cartón | ~2,6:1 | **Prohibido para texto.** Solo iconos grandes, bordes y decoración |

Regla práctica: **el texto sobre naranja siempre es tinta**, y en modo claro los enlaces van en tinta subrayada, no en naranja.

## 4. Tipografía

Ambas fuentes se cargan con `next/font/google`.

| Rol | Fuente | Peso | Variable CSS | Utilidad |
|---|---|---|---|---|
| Display, títulos, logotipo | Bricolage Grotesque | 800 (títulos), 500 (subtítulos) | `--font-bricolage` | `font-display` |
| Texto, UI | DM Sans | 400, 500, 700 | `--font-dm-sans` | `font-sans` |

Escala (rem a 16 px de base):

| Uso | Tamaño | Fuente | Notas |
|---|---|---|---|
| Hero | 3.5–4.5 rem | Display 800 | `tracking-tight`, `leading-none` |
| H1 | 2.5 rem | Display 800 | `tracking-tight` |
| H2 | 1.75 rem | Display 800 | |
| H3 | 1.25 rem | Sans 700 | |
| Cuerpo | 1 rem | Sans 400 | `leading-relaxed` |
| Pequeño | 0.875 rem | Sans 400/500 | |
| Etiqueta | 0.75 rem | Sans 700 | Mayúsculas, `tracking-[0.2em]` |

No usar Bricolage para párrafos ni para texto de menos de 18 px.

## 5. Espaciado, radios y sombras

- **Espaciado:** escala de Tailwind (base 4 px). Secciones de página con `py-16` a `py-24`; padding interno de tarjetas `p-6`.
- **Radios:** botones e inputs `rounded-xl` (12 px); tarjetas `rounded-2xl` (16 px); iconos de app y avatares de marca `rounded-[28px]`.
- **Sombras:** mínimas. Preferir bordes `border-border` a sombras. Si hace falta elevación (modales, menús), `shadow-lg` con color tinta a baja opacidad.

## 6. Componentes base

### Botón

| Variante | Clases clave | Uso |
|---|---|---|
| Primario | `bg-primary text-primary-foreground font-bold rounded-xl` | Una sola acción principal por vista ("Pedir presupuesto") |
| Secundario | `bg-foreground text-background rounded-xl` | Acción importante no principal |
| Contorno | `border-2 border-foreground text-foreground rounded-xl` | Acciones secundarias |
| Fantasma | `text-foreground hover:bg-foreground/5` | Acciones terciarias, menús |

Foco visible siempre: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`.

### Tarjeta

`bg-surface border border-border rounded-2xl p-6`. Título en `font-display`, texto en `text-muted`.

### Input

`bg-surface border border-border rounded-xl px-4 py-3`, foco con `outline-primary`. La etiqueta siempre visible encima del campo, nunca solo placeholder.

## 7. Elementos gráficos de marca

- **Cinta gráfica:** banda naranja con "MUDARO ›" repetido en tinta, extremo izquierdo dentado (cinta cortada) y extremo derecho en punta de flecha. Uso: separadores de sección en marketing, cabeceras de email, rotulación de furgoneta y cajas. Máximo una por pantalla. No usar dentro de la app transaccional (formularios, panel).
- **Rollo de cinta:** ilustración aislada para estados vacíos, carga y onboarding.
- **Kraft:** fondo de apoyo para ilustraciones y bloques de "cómo funciona".

## 8. Iconografía e imagen

- Iconos de línea con trazo 2 px y extremos redondeados (por ejemplo, Lucide), en `currentColor`.
- Fotografía: personas reales en mudanzas, luz natural, nada de banco de imágenes posado. Si no hay fotos propias, usar ilustración con la paleta antes que fotos genéricas.

## 9. Tono de voz

- Tuteo, frases cortas, verbos concretos ("Pide tu presupuesto", "Elige el día").
- Tranquilizar sin exagerar: hablar de lo que se hace, no de promesas grandilocuentes.
- Evitar fórmulas de publicidad gastadas ("más que una mudanza", "la mejor experiencia").

## 10. Implementación

- Tokens en `app/globals.css`: primitivos en `:root`, semánticos en `:root` y `[data-theme="dark"]`, expuestos a Tailwind con `@theme inline`.
- Modo oscuro por atributo `data-theme` en `<html>`, gestionado en el cliente (por ejemplo con `next-themes`). No leer `cookies()` en el layout raíz para el tema: rompería el shell estático con Cache Components.
- Variante `dark:` de Tailwind ligada a `[data-theme="dark"]` con `@custom-variant`.

### Reglas para agentes de IA y para el equipo

1. No escribir colores hex ni valores arbitrarios (`bg-[#...]`) en componentes. Usar solo tokens semánticos.
2. No añadir fuentes nuevas.
3. Texto sobre naranja siempre en tinta. Nunca texto naranja sobre fondo claro.
4. Una única acción primaria (botón naranja) por vista.
5. Todo componente nuevo debe verse bien en claro y en oscuro antes de darse por terminado.
6. Si una necesidad no está cubierta por este documento, proponer el cambio aquí primero.
