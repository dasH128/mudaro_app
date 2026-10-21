# apps/empresa

Panel web del transportista (app.mudaro.pt). Next.js 16, puerto 3001.

## Idiomas (i18n)

Un archivo JSON por idioma en `app/i18n/dictionaries/`. `en.json` es la fuente de verdad y el idioma por defecto: si a otro idioma le falta una clave, se muestra el texto en inglés; si el navegador pide un idioma sin archivo, se redirige a `/en`.

Para añadir un idioma: crear `app/i18n/dictionaries/<código>.json` (puede estar incompleto) y añadir el código a `LOCALES` en `app/i18n/config.ts`.

En un Server Component: `const dict = await getDictionary()`. Los Client Components reciben los textos por props. Enlaces siempre con `localePath(lang, ROUTES.x)`.

## Tema claro / oscuro

Lo gestiona `ThemeProvider` (`next-themes`, atributo `data-theme` en `<html>`), por defecto según el sistema. Los tokens de ambos temas están en `app/globals.css`; en componentes usar solo tokens semánticos.
