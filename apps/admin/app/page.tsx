import { redirect } from "next/navigation";

import { ROUTES } from "@/app/lib/routes";

// Provisional: cuando exista /empresas, decidirá según la sesión.
export default function Home() {
  redirect(ROUTES.login);
}
