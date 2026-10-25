import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { routeForAuthStep } from "@/app/lib/auth";
import { getAuthStep } from "@/features/auth/data/auth.repo";
import { EnrollForm } from "@/features/auth/components/enroll-form";

export const metadata: Metadata = {
  title: "Painel Mudaro · Ativar verificação",
};

export default async function EnrollMfaPage() {
  // Solo con contraseña correcta y sin MFA todavía; si ya hay un factor, pide el código.
  const step = await getAuthStep();
  if (step !== "enroll") redirect(routeForAuthStep(step));

  return <EnrollForm />;
}
