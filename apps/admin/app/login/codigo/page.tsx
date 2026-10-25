import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { routeForAuthStep } from "@/app/lib/auth";
import { getAuthStep } from "@/features/auth/data/auth.repo";
import { CodeForm } from "@/features/auth/components/code-form";

export const metadata: Metadata = {
  title: "Painel Mudaro · Verificação",
};

export default async function CodePage() {
  // Solo tiene sentido con contraseña correcta y MFA ya activado; si no, vuelve al paso que toca.
  const step = await getAuthStep();
  if (step !== "code") redirect(routeForAuthStep(step));

  return <CodeForm />;
}
