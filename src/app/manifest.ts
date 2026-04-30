import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Knowledge Bud",
    short_name: "Knowledge Bud",
    description:
      "Monthly digest of vetted mental health research, in an easy-to-read feed.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFBFD",
    theme_color: "#F47BAB",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
