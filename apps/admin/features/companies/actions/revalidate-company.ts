import "server-only";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/app/lib/routes";

export function revalidateCompany(companyId: string) {
  revalidatePath(ROUTES.companies.detail(companyId));
  revalidatePath(ROUTES.companies.list);
}
