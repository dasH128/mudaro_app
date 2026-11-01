"use client";

import type { ReactNode } from "react";
import { useLinkStatus } from "next/link";

import { Spinner } from "./spinner";

// Va dentro de un <Link>: mientras el servidor responde a esa navegación, enseña un spinner.
// Los filtros y paneles de las listas viajan en la URL, así que sin esto no hay señal de que el clic ha hecho algo.
// Con `children`, el spinner sustituye a ese contenido (un icono, por ejemplo) en lugar de añadirse a él.
export function LinkPending({ children }: { children?: ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner /> : (children ?? null);
}
