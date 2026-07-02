import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maison — Your Creative Studio",
    short_name: "Maison",
    description:
      "A fashion-forward personal life management app. Your atelier, digitized.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#100d09",
    theme_color: "#100d09",
    icons: [
      {
        src: "/api/pwa-icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
