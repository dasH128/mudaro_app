"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Dictionary } from "@/app/i18n/get-dictionary";

export type UnexpectedErrorText = Dictionary["app"]["errors"]["unexpected"];

const ErrorTextContext = createContext<UnexpectedErrorText | null>(null);

/**
 * Textos de la pantalla de error inesperado. `error.tsx` tiene que ser componente de cliente y no puede leer el
 * diccionario, así que el layout de (app) se los pasa con este contexto: el layout envuelve al error.tsx del segmento.
 */
export function ErrorTextProvider({ value, children }: { value: UnexpectedErrorText; children: ReactNode }) {
  return <ErrorTextContext.Provider value={value}>{children}</ErrorTextContext.Provider>;
}

export function useErrorText(): UnexpectedErrorText | null {
  return useContext(ErrorTextContext);
}
