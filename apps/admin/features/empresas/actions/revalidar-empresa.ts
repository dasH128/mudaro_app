import "server-only";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/app/lib/routes";

export function revalidarEmpresa(empresaId: string) {
  revalidatePath(ROUTES.empresas.detail(empresaId));
  revalidatePath(ROUTES.empresas.list);
}
