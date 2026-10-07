import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export", // static HTML into /out
  trailingSlash: true, // friendlier on S3 / plain static hosts
  images: { unoptimized: true }, // optimizer needs a server; we pre-optimize instead
  reactCompiler: true, // needs babel-plugin-react-compiler
  // Dev only: let phones on the same network use the dev server via the LAN IP.
  // Next blocks dev assets for unknown hostnames, so without this the page loads
  // but never hydrates. Private ranges only; ignored by the static export.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default config;
