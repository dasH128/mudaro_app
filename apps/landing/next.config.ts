import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Se compila el código fuente de @mudaro/ui (exporta .ts/.tsx sin build previo)
  transpilePackages: ["@mudaro/ui"],
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
