import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Se compila el código fuente de @mudaro/ui, @mudaro/supabase y @mudaro/validation (exportan .ts/.tsx sin build previo)
  transpilePackages: ["@mudaro/ui", "@mudaro/supabase", "@mudaro/validation"],
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
