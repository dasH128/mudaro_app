import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
