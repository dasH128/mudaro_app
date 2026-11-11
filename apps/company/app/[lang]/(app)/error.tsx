"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { TippedBoxArt } from "@/app/components/error-art";
import { ErrorState } from "@/app/components/error-state";
import { useErrorText } from "@/app/components/error-text-provider";
import { errorDigest, fallbackErrorText, localeFromPath } from "@/app/i18n/fallback-error-text";
import { interpolate } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";

/**
 * Error inesperado dentro del panel (Supabase caído, fallo de red, bug). Se ve con el menú, porque el layout de (app)
 * queda fuera de este límite. Nunca muestra el mensaje técnico: en producción Next ya lo sustituye por uno genérico.
 * El código de referencia es el `digest`, que identifica el error en los logs del servidor.
 */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  const locale = localeFromPath(usePathname());
  const t = useErrorText() ?? fallbackErrorText(locale);
  const digest = errorDigest(error);

  useEffect(() => {
    // Queda en la consola del navegador; el detalle completo está en el log del servidor con el mismo digest
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      art={<TippedBoxArt />}
      title={t.title}
      text={t.text}
      action={{ label: t.retry, onClick: retry }}
      secondary={{ label: t.home, href: localePath(locale, ROUTES.home) }}
      footnote={digest ? interpolate(t.code, { code: digest }) : undefined}
    />
  );
}
