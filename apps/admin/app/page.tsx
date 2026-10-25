import { redirect } from "next/navigation";

import { ROUTES } from "@/app/lib/routes";

// Sin sesión, el proxy ya manda a /login; con sesión, requirePlatformUser() decide en el layout.
export default function Home() {
  redirect(ROUTES.empresas.list);
}
