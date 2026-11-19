import "server-only";

// Dirección de la web del cliente (`apps/client`). El dominio definitivo está por decidir
// (docs/architecture-system.md); en local, `pnpm dev --filter=client` la sirve en el puerto 3003.
const DEV_CLIENT_URL = "http://localhost:3003";

/** Enlace del pedido que recibe el cliente. El token va en la ruta y solo existe en este momento (RNF-02). */
export function clientLinkUrl(token: string): string {
  const configured = process.env.CLIENT_APP_URL?.trim();
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("orders: falta CLIENT_APP_URL (dirección de la web del cliente)");
  }
  const base = (configured || DEV_CLIENT_URL).replace(/\/+$/, "");
  return `${base}/p/${token}`;
}
