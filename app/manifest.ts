import type { MetadataRoute } from "next";

// Rend LifeOS installable sur l'écran d'accueil (téléphone/tablette).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeOS",
    short_name: "LifeOS",
    description: "Personal Life OS & Routine Hub",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d0f",
    theme_color: "#0d0d0f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
