"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import "./globals.css";
import { TippedBoxArt } from "@/app/components/error-art";
import { ErrorState } from "@/app/components/error-state";
import { errorDigest, fallbackErrorText, localeFromPath } from "@/app/i18n/fallback-error-text";
import { interpolate } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";

/**
 * Último recurso: falla el propio layout raíz (o algo fuera de (app)). Sustituye al documento entero, así que lleva
 * su <html> y sus estilos, y no tiene diccionario ni tema: textos de fallback-error-text.ts y tema claro.
 * El idioma sale de la URL.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const locale = localeFromPath(usePathname() ?? "");
  const t = fallbackErrorText(locale);
  const digest = errorDigest(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col bg-background px-4 text-foreground">
        <title>{t.title}</title>
        <ErrorState
          art={<TippedBoxArt />}
          title={t.title}
          text={t.text}
          action={{ label: t.retry, onClick: retry }}
          secondary={{ label: t.home, href: localePath(locale, ROUTES.home) }}
          footnote={digest ? interpolate(t.code, { code: digest }) : undefined}
        />
      </body>
    </html>
  );
}
