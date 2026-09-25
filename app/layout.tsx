import type { Metadata } from "next";
import "./globals.css";
import "./premium.css";

export const metadata: Metadata = {
  title: "Kisse Safar Ke — Explore India through real experiences",
  description: "Discover destinations across India, share travel reviews and photos, and save ideas for your next trip.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body id="top" className="antialiased"><div className="travel-backdrop" aria-hidden="true" />{children}</body>
    </html>
  );
}
