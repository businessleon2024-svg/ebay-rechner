import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        /*
          Der Service Worker darf selbst nie aus dem Zwischenspeicher kommen.
          Sonst behält der Browser eine alte Fassung und damit auch deren
          Regeln — und niemand bekommt die Korrektur je zu sehen.
        */
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
