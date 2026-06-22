import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verhindert, dass Next.js pdf-parse bündelt — sonst findet pdf.js seinen
  // Web-Worker zur Laufzeit nicht mehr (führt zu "Setting up fake worker failed").
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
