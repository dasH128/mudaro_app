import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Solo desarrollo: deja abrir la app desde el móvil por la IP del ordenador (ver .env.example). Sin esto, Next.js
  // bloquea los recursos de desarrollo que llegan por esa IP y la página se ve pero no responde.
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  experimental: {
    // Fotos y actas del trabajo (paso 6.5): hasta 5 MB por fichero (límite del bucket job-evidence) más el resto del
    // formulario. El límite por defecto de las Server Actions es 1 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Se compila el código fuente de los paquetes del monorepo (exportan .ts/.tsx sin build previo)
  transpilePackages: ["@mudaro/ui", "@mudaro/supabase", "@mudaro/validation", "@mudaro/inventory", "@mudaro/quotes"],
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
