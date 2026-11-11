import type { Metadata, Viewport } from "next";

import { AppProviders } from "@/components/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Reverie — Music Cataloguing",
    template: "%s — Reverie",
  },
  description:
    "Give your vinyl a digital second life. Identify, understand, and organize every pressing.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#12100f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
