import { redirect } from "next/navigation";

// Provisional: cuando exista /empresas, decidirá según la sesión.
export default function Home() {
  redirect("/login");
}
