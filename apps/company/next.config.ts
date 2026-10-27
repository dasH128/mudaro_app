import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Se compila el código fuente de @mudaro/ui y @mudaro/supabase (exportan .ts/.tsx sin build previo)
  transpilePackages: ["@mudaro/ui", "@mudaro/supabase"],
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
