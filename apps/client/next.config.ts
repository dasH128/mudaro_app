import type { NextConfig } from "next";

// Web del cliente: se abre con el enlace del pedido, que lleva el token en la ruta (/p/<token>).
// - Referrer-Policy no-referrer: el token no sale hacia otras webs al seguir un enlace.
// - noindex: ningún buscador debe guardar un enlace de pedido.
// - Sin iframes de otros sitios y sin scripts de terceros.
const SECURITY_HEADERS = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Se compila el código fuente de los paquetes del monorepo (exportan .ts/.tsx sin build previo)
  transpilePackages: ["@mudaro/ui", "@mudaro/validation", "@mudaro/inventory"],
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
