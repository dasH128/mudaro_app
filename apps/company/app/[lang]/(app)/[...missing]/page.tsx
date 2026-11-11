import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { requireCompanySession } from "@/features/auth/application/require-session";

// Cualquier URL del panel que no coincide con una ruta. Sin esto, Next mostraría su 404 genérica en inglés,
// porque el layout raíz es [lang] y no hay un not-found raíz que pueda usarlo.
// Primero se comprueba la sesión: a quien no ha entrado se le manda al login, no se le dice qué existe.
export default async function MissingPage() {
  await requireCompanySession(await lang());
  notFound();
}
